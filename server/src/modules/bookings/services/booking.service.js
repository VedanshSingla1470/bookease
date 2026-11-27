import mongoose from "mongoose";
import {
  formatInTimeZone,
  fromZonedTime,
} from "date-fns-tz";

import Booking from "../models/booking.model.js";
import BookingSlot from "../models/bookingSlot.model.js";

import Organization from "../../organizations/models/organization.model.js";
import Service from "../../services/models/service.model.js";
import Staff from "../../staff/models/staff.model.js";

import WeeklySchedule from "../../availability/models/weeklySchedule.model.js";
import AvailabilityOverride from "../../availability/models/availabilityOverride.model.js";

import AppError from "../../../common/errors/AppError.js";

const SLOT_MINUTES = 15;
const SLOT_MS = SLOT_MINUTES * 60 * 1000;

const validateObjectId = (id) => {
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError("Invalid ID provided.", 400);
  }
};

const escapeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getOrganization = async (organizationId) => {
  validateObjectId(organizationId);

  const organization = await Organization.findOne({
    _id: organizationId,
    status: "ACTIVE",
  });

  if (!organization) {
    throw new AppError("Organization not found.", 404);
  }

  return organization;
};

const getActiveService = async (organizationId, serviceId) => {
  validateObjectId(serviceId);

  const service = await Service.findOne({
    _id: serviceId,
    organization: organizationId,
    status: "ACTIVE",
  });

  if (!service) {
    throw new AppError("Active service not found.", 404);
  }

  return service;
};

const getActiveStaff = async (organizationId, staffId) => {
  validateObjectId(staffId);

  const staff = await Staff.findOne({
    _id: staffId,
    organization: organizationId,
    status: "ACTIVE",
  });

  if (!staff) {
    throw new AppError("Active staff member not found.", 404);
  }

  return staff;
};

const getLocalDateParts = (date) => {
  const [year, month, day] = date.split("-").map(Number);

  return {
    year,
    month,
    day,
    dayOfWeek: new Date(
      Date.UTC(year, month - 1, day)
    ).getUTCDay(),
  };
};

const getUtcInterval = (date, interval, timezone) => ({
  start: fromZonedTime(
    `${date}T${interval.startTime}:00`,
    timezone
  ),
  end: fromZonedTime(
    `${date}T${interval.endTime}:00`,
    timezone
  ),
});

const getWorkingIntervals = async (
  organizationId,
  staffId,
  date,
  timezone
) => {
  const override = await AvailabilityOverride.findOne({
    organization: organizationId,
    staff: staffId,
    date,
  });

  if (override) {
    if (override.type === "CLOSED") {
      return [];
    }

    return override.intervals;
  }

  const schedule = await WeeklySchedule.findOne({
    organization: organizationId,
    staff: staffId,
  });

  if (!schedule) {
    return [];
  }

  const { dayOfWeek } = getLocalDateParts(date);

  const day = schedule.days.find(
    (item) => item.dayOfWeek === dayOfWeek
  );

  if (!day || !day.isWorkingDay) {
    return [];
  }

  return day.intervals;
};

const getAvailableSlots = async ({
  organization,
  staff,
  service,
  date,
}) => {
  const timezone = organization.timezone;

  const intervals = await getWorkingIntervals(
    organization._id,
    staff._id,
    date,
    timezone
  );

  if (!intervals.length) {
    return [];
  }

  const durationMs = service.durationMinutes * 60 * 1000;

  const availableCandidates = [];

  for (const interval of intervals) {
    const { start, end } = getUtcInterval(
      date,
      interval,
      timezone
    );

    for (
      let candidate = start.getTime();
      candidate + durationMs <= end.getTime();
      candidate += SLOT_MS
    ) {
      if (candidate <= Date.now()) {
        continue;
      }

      availableCandidates.push(candidate);
    }
  }

  if (!availableCandidates.length) {
    return [];
  }

  const earliest = new Date(
    Math.min(...availableCandidates)
  );

  const latest = new Date(
    Math.max(...availableCandidates) +
      durationMs
  );

  const occupiedSlots = await BookingSlot.find({
    organization: organization._id,
    staff: staff._id,
    slotStart: {
      $gte: earliest,
      $lt: latest,
    },
  }).select("slotStart");

  const occupied = new Set(
    occupiedSlots.map((slot) =>
      slot.slotStart.getTime()
    )
  );

  const available = availableCandidates.filter(
    (candidate) => {
      for (
        let block = candidate;
        block < candidate + durationMs;
        block += SLOT_MS
      ) {
        if (occupied.has(block)) {
          return false;
        }
      }

      return true;
    }
  );

  return available.map((timestamp) => ({
    startAt: new Date(timestamp).toISOString(),

    endAt: new Date(
      timestamp + durationMs
    ).toISOString(),

    localStart: formatInTimeZone(
      new Date(timestamp),
      timezone,
      "HH:mm"
    ),

    localEnd: formatInTimeZone(
      new Date(timestamp + durationMs),
      timezone,
      "HH:mm"
    ),

    timezone,
  }));
};

export const getAvailableSlotsForService = async (
  organizationId,
  serviceId,
  staffId,
  date
) => {
  const organization = await getOrganization(organizationId);

  const service = await getActiveService(
    organizationId,
    serviceId
  );

  const staff = await getActiveStaff(
    organizationId,
    staffId
  );

  const slots = await getAvailableSlots({
    organization,
    staff,
    service,
    date,
  });

  return {
    date,
    timezone: organization.timezone,
    service: {
      id: service._id,
      name: service.name,
      durationMinutes: service.durationMinutes,
      price: service.price,
      currency: service.currency,
    },
    staff: {
      id: staff._id,
    },
    slots,
  };
};

export const createBooking = async (
  organizationId,
  customerId,
  data
) => {
  const organization = await getOrganization(organizationId);

  const service = await getActiveService(
    organizationId,
    data.serviceId
  );

  const staff = await getActiveStaff(
    organizationId,
    data.staffId
  );

  const startAt = new Date(data.startAt);

  if (startAt.getTime() <= Date.now()) {
    throw new AppError(
      "Cannot book an appointment in the past.",
      400
    );
  }

  if (startAt.getTime() % SLOT_MS !== 0) {
    throw new AppError(
      "Appointment start time must align with a 15-minute slot.",
      400
    );
  }

  const endAt = new Date(
    startAt.getTime() +
      service.durationMinutes * 60 * 1000
  );

  const localDate = formatInTimeZone(
    startAt,
    organization.timezone,
    "yyyy-MM-dd"
  );

  const available = await getAvailableSlots({
    organization,
    staff,
    service,
    date: localDate,
  });

  const requestedSlot = available.find(
    (slot) =>
      new Date(slot.startAt).getTime() ===
      startAt.getTime()
  );

  if (!requestedSlot) {
    throw new AppError(
      "This appointment slot is no longer available.",
      409
    );
  }

  const session = await mongoose.startSession();

  try {
    let createdBooking;

    await session.withTransaction(async () => {
      const [booking] = await Booking.create(
        [
          {
            organization: organization._id,
            customer: customerId,
            staff: staff._id,
            service: service._id,

            serviceSnapshot: {
              name: service.name,
              durationMinutes: service.durationMinutes,
              price: service.price,
              currency: service.currency,
            },

            startAt,
            endAt,
            timezone: organization.timezone,
            customerNotes: data.customerNotes ?? "",
            status: "CONFIRMED",
          },
        ],
        { session }
      );

      const slots = [];

      for (
        let timestamp = startAt.getTime();
        timestamp < endAt.getTime();
        timestamp += SLOT_MS
      ) {
        slots.push({
          organization: organization._id,
          staff: staff._id,
          booking: booking._id,
          slotStart: new Date(timestamp),
        });
      }

      await BookingSlot.insertMany(slots, {
        session,
        ordered: true,
      });

      createdBooking = booking;
    });

    return await Booking.findById(createdBooking._id)
      .populate("customer", "firstName lastName email")
      .populate("staff")
      .populate("service");
  } catch (error) {
    if (error.code === 11000) {
      throw new AppError(
        "This appointment was just booked by someone else. Please choose another time.",
        409
      );
    }

    throw error;
  } finally {
    await session.endSession();
  }
};

export const getCustomerBookings = async (
  organizationId,
  customerId,
  filters
) => {
  await getOrganization(organizationId);

  const { page, limit, status, from, to } = filters;

  const query = {
    organization: organizationId,
    customer: customerId,
  };

  if (status !== "ALL") {
    query.status = status;
  }

  if (from || to) {
    query.startAt = {};

    if (from) query.startAt.$gte = new Date(from);
    if (to) query.startAt.$lte = new Date(to);
  }

  const skip = (page - 1) * limit;

  const [bookings, total] = await Promise.all([
    Booking.find(query)
      .populate("organization", "name slug timezone")
      .populate("staff")
      .sort({ startAt: -1 })
      .skip(skip)
      .limit(limit),

    Booking.countDocuments(query),
  ]);

  return {
    bookings,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getOrganizationBookings = async (
  organizationId,
  filters
) => {
  const { page, limit, status, from, to } = filters;

  const query = {
    organization: organizationId,
  };

  if (status !== "ALL") {
    query.status = status;
  }

  if (from || to) {
    query.startAt = {};

    if (from) query.startAt.$gte = new Date(from);
    if (to) query.startAt.$lte = new Date(to);
  }

  const skip = (page - 1) * limit;

  const [bookings, total] = await Promise.all([
    Booking.find(query)
      .populate("customer", "firstName lastName email")
      .populate("staff")
      .sort({ startAt: 1 })
      .skip(skip)
      .limit(limit),

    Booking.countDocuments(query),
  ]);

  return {
    bookings,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const cancelBooking = async (
  organizationId,
  bookingId,
  customerId,
  reason
) => {
  validateObjectId(bookingId);
  await getOrganization(organizationId);

  const session = await mongoose.startSession();

  try {
    let cancelledBooking;

    await session.withTransaction(async () => {
      const booking = await Booking.findOne({
        _id: bookingId,
        organization: organizationId,
        customer: customerId,
      }).session(session);

      if (!booking) {
        throw new AppError("Booking not found.", 404);
      }

      if (booking.status !== "CONFIRMED") {
        throw new AppError(
          "Only confirmed bookings can be cancelled.",
          400
        );
      }

      booking.status = "CANCELLED";
      booking.cancelledAt = new Date();
      booking.cancellationReason = reason ?? "";

      await booking.save({ session });

      await BookingSlot.deleteMany(
        { booking: booking._id },
        { session }
      );

      cancelledBooking = booking;
    });

    return cancelledBooking;
  } finally {
    await session.endSession();
  }
};