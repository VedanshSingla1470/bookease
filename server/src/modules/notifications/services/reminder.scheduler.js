
import cron from "node-cron";

import Booking from "../../bookings/models/booking.model.js";
import Notification from "../models/notification.model.js";
import {
  createEmailNotification,
  deliverNotification,
} from "./notification.service.js";

let schedulerStarted = false;

async function createUpcomingReminders() {
  const now = new Date();
  const reminderCutoff = new Date(
    now.getTime() + 24 * 60 * 60 * 1000
  );

  const upcomingBookings = await Booking.find({
    status: "CONFIRMED",
    startAt: {
      $gt: now,
      $lte: reminderCutoff,
    },
  }).select("_id startAt");

  for (const booking of upcomingBookings) {
    const scheduledFor = new Date(
      booking.startAt.getTime() - 24 * 60 * 60 * 1000
    );

    try {
      await createEmailNotification({
        bookingId: booking._id,
        type: "BOOKING_REMINDER",
        scheduledFor,
      });
    } catch (error) {
      console.error(
        `Could not create reminder for booking ${booking._id}:`,
        error.message
      );
    }
  }
}


async function processDueNotifications() {
  const now = new Date();

  const staleProcessingTime = new Date(
    now.getTime() - 10 * 60 * 1000
  );

  const dueNotifications = await Notification.find({
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
  })
    .sort({ scheduledFor: 1 })
    .limit(100)
    .select("_id");

  for (const notification of dueNotifications) {
    await deliverNotification(notification._id);
  }
}


async function runReminderCycle() {
  try {
    await createUpcomingReminders();
    await processDueNotifications();
  } catch (error) {
    console.error("Notification scheduler error:", error);
  }
}

export function startReminderScheduler() {
  if (schedulerStarted) {
    return;
  }

  schedulerStarted = true;

  // Run once at startup, then every minute.
  void runReminderCycle();

  cron.schedule("* * * * *", () => {
    void runReminderCycle();
  });

  console.log("BookEase notification scheduler started.");
}
