
import mongoose from "mongoose";
import { formatInTimeZone } from "date-fns-tz";

import Notification from "../models/notification.model.js";
import Booking from "../../bookings/models/booking.model.js";
import AppError from "../../../common/errors/AppError.js";
import { sendEmail } from "./email.service.js";

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[character];
  });
}

function buildEmailContent(booking, type, reason = "") {
  const timezone = booking.timezone || "Asia/Kolkata";
  const customerName = booking.customer.firstName || "Customer";
  const serviceName = booking.serviceSnapshot.name;
  const organizationName = booking.organization.name;

  const appointmentDate = formatInTimeZone(
    booking.startAt,
    timezone,
    "dd MMM yyyy"
  );

  const appointmentTime = formatInTimeZone(
    booking.startAt,
    timezone,
    "hh:mm a"
  );

  const safeCustomer = escapeHtml(customerName);
  const safeService = escapeHtml(serviceName);
  const safeOrganization = escapeHtml(organizationName);
  const safeReason = escapeHtml(reason);

  let subject;
  let heading;
  let message;

  if (type === "BOOKING_CONFIRMED") {
    subject = `Booking confirmed - ${organizationName}`;
    heading = "Your booking is confirmed!";
    message = "Your appointment has been successfully booked.";
  } else if (type === "BOOKING_CANCELLED") {
    subject = `Booking cancelled - ${organizationName}`;
    heading = "Your booking has been cancelled";
    message = reason
      ? `Cancellation reason: ${reason}`
      : "Your appointment has been cancelled.";
  } else {
    subject = `Appointment reminder - ${organizationName}`;
    heading = "Your appointment is coming up!";
    message = "This is a reminder about your upcoming appointment.";
  }

  const text = [
    `Hello ${customerName},`,
    "",
    message,
    "",
    `Business: ${organizationName}`,
    `Service: ${serviceName}`,
    `Date: ${appointmentDate}`,
    `Time: ${appointmentTime} (${timezone})`,
    "",
    "Thank you for choosing BookEase.",
  ].join("\n");

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; color: #222;">
      <h2>${heading}</h2>
      <p>Hello ${safeCustomer},</p>
      <p>${escapeHtml(message)}</p>

      <div style="padding: 16px; background: #f5f5f5; border-radius: 8px;">
        <p><strong>Business:</strong> ${safeOrganization}</p>
        <p><strong>Service:</strong> ${safeService}</p>
        <p><strong>Date:</strong> ${appointmentDate}</p>
        <p><strong>Time:</strong> ${appointmentTime} (${escapeHtml(timezone)})</p>
      </div>

      ${
        type === "BOOKING_CANCELLED" && reason
          ? `<p><strong>Reason:</strong> ${safeReason}</p>`
          : ""
      }

      <p>Thank you for choosing BookEase.</p>
    </div>
  `;

  return { subject, text, html };
}

async function loadBooking(bookingId) {
  const booking = await Booking.findById(bookingId)
    .populate("customer", "firstName lastName email")
    .populate("organization", "name timezone");

  if (!booking || !booking.customer || !booking.organization) {
    throw new AppError("Booking details could not be loaded.", 404);
  }

  if (!booking.customer.email) {
    throw new AppError("Customer email address is missing.", 400);
  }

  return booking;
}

export async function createEmailNotification({
  bookingId,
  type,
  reason = "",
  scheduledFor = new Date(),
}) {
  const booking = await loadBooking(bookingId);

  const content = buildEmailContent(booking, type, reason);

  // The unique index makes this operation safe against duplicate creation.
  const notification = await Notification.findOneAndUpdate(
    {
      booking: booking._id,
      type,
      channel: "EMAIL",
    },
    {
      $setOnInsert: {
        organization: booking.organization._id,
        booking: booking._id,
        recipientEmail: booking.customer.email,
        recipientName: `${booking.customer.firstName || ""} ${
          booking.customer.lastName || ""
        }`.trim(),
        type,
        channel: "EMAIL",
        status: "PENDING",
        subject: content.subject,
        text: content.text,
        html: content.html,
        scheduledFor,
        nextAttemptAt: scheduledFor,
      },
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    }
  );

  return notification;
}

export async function deliverNotification(notificationId) {
  if (!mongoose.isValidObjectId(notificationId)) {
    return null;
  }

  const now = new Date();
  const staleProcessingTime = new Date(now.getTime() - 10 * 60 * 1000);

  // Atomically claim the notification so two scheduler instances
  // cannot normally send the same email simultaneously.
  const notification = await Notification.findOneAndUpdate(
    {
      _id: notificationId,
      attempts: { $lt: 3 },
      $or: [
        {
          status: "PENDING",
          scheduledFor: { $lte: now },
        },
        {
          status: "FAILED",
          nextAttemptAt: { $lte: now },
        },
        {
          status: "PROCESSING",
          processingAt: { $lte: staleProcessingTime },
        },
      ],
    },
    {
      $set: {
        status: "PROCESSING",
        processingAt: now,
      },
      $inc: {
        attempts: 1,
      },
    },
    { new: true }
  );

  if (!notification) {
    return null;
  }

  try {
    await sendEmail({
      to: notification.recipientEmail,
      subject: notification.subject,
      text: notification.text,
      html: notification.html,
    });

    await Notification.updateOne(
      { _id: notification._id, status: "PROCESSING" },
      {
        $set: {
          status: "SENT",
          sentAt: new Date(),
          lastError: null,
        },
        $unset: {
          processingAt: "",
        },
      }
    );

    return { status: "SENT" };
  } catch (error) {
    const retryDelayMs = 5 * 60 * 1000;

    await Notification.updateOne(
      { _id: notification._id, status: "PROCESSING" },
      {
        $set: {
          status: "FAILED",
          lastError: error.message,
          nextAttemptAt: new Date(Date.now() + retryDelayMs),
        },
        $unset: {
          processingAt: "",
        },
      }
    );

    console.error(
      `Notification ${notification._id} failed:`,
      error.message
    );

    return { status: "FAILED", error: error.message };
  }
}

export async function queueBookingNotification({
  bookingId,
  type,
  reason = "",
}) {
  try {
    const notification = await createEmailNotification({
      bookingId,
      type,
      reason,
    });

    await deliverNotification(notification._id);
  } catch (error) {
    // Notification failure must not undo a successfully committed booking.
    console.error("Could not queue booking notification:", error.message);
  }
}

export async function getCustomerNotifications(
  organizationId,
  customerId,
  { page = 1, limit = 10 } = {}
) {
  const skip = (page - 1) * limit;

  const filter = {
    organization: organizationId,
    booking: {
      $in: await Booking.find({
        organization: organizationId,
        customer: customerId,
      }).distinct("_id"),
    },
  };

  const [notifications, total] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("-html -text"),
    Notification.countDocuments(filter),
  ]);

  return {
    notifications,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}

export async function getOrganizationNotifications(
  organizationId,
  { page = 1, limit = 20, status } = {}
) {
  const skip = (page - 1) * limit;

  const filter = { organization: organizationId };

  if (status) {
    filter.status = status;
  }

  const [notifications, total] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("-html -text"),
    Notification.countDocuments(filter),
  ]);

  return {
    notifications,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}
