import mongoose from "mongoose";

import WeeklySchedule from "../models/weeklySchedule.model.js";
import AvailabilityOverride from "../models/availabilityOverride.model.js";

import Staff from "../../staff/models/staff.model.js";

import AppError from "../../../common/errors/AppError.js";

const validateObjectId = (id) => {
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError("Invalid ID provided.", 400);
  }
};

const ensureStaffExists = async (organizationId, staffId) => {
  validateObjectId(staffId);

  const staff = await Staff.findOne({
    _id: staffId,
    organization: organizationId,
    status: "ACTIVE",
  });

  if (!staff) {
    throw new AppError(
      "Active staff member not found in this organization.",
      404
    );
  }

  return staff;
};

export const getWeeklySchedule = async (
  organizationId,
  staffId
) => {
  await ensureStaffExists(organizationId, staffId);

  return WeeklySchedule.findOne({
    organization: organizationId,
    staff: staffId,
  });
};

export const updateWeeklySchedule = async (
  organizationId,
  staffId,
  userId,
  timezone,
  days
) => {
  await ensureStaffExists(organizationId, staffId);

  // Store days in a predictable Sunday-to-Saturday order.
  const sortedDays = [...days].sort(
    (a, b) => a.dayOfWeek - b.dayOfWeek
  );

  const schedule = await WeeklySchedule.findOneAndUpdate(
    {
      organization: organizationId,
      staff: staffId,
    },
    {
      $set: {
        days: sortedDays,
        timezone,
        updatedBy: userId,
      },
      $setOnInsert: {
        organization: organizationId,
        staff: staffId,
      },
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    }
  );

  return schedule;
};

export const getAvailabilityOverrides = async (
  organizationId,
  staffId,
  from,
  to
) => {
  await ensureStaffExists(organizationId, staffId);

  return AvailabilityOverride.find({
    organization: organizationId,
    staff: staffId,
    date: {
      $gte: from,
      $lte: to,
    },
  }).sort({ date: 1 });
};

export const createAvailabilityOverride = async (
  organizationId,
  staffId,
  userId,
  data
) => {
  await ensureStaffExists(organizationId, staffId);

  const override = await AvailabilityOverride.create({
    organization: organizationId,
    staff: staffId,
    date: data.date,
    type: data.type,
    intervals: data.type === "CLOSED" ? [] : data.intervals,
    reason: data.reason,
    createdBy: userId,
  });

  return override;
};

export const updateAvailabilityOverride = async (
  organizationId,
  staffId,
  overrideId,
  data
) => {
  validateObjectId(overrideId);
  await ensureStaffExists(organizationId, staffId);

  const override = await AvailabilityOverride.findOne({
    _id: overrideId,
    organization: organizationId,
    staff: staffId,
  });

  if (!override) {
    throw new AppError("Availability override not found.", 404);
  }

  const nextType = data.type ?? override.type;

  const nextIntervals =
    data.intervals ??
    (nextType === "CLOSED" ? [] : override.intervals);

  if (nextType === "CLOSED" && nextIntervals.length > 0) {
    throw new AppError(
      "A closed day cannot contain working intervals.",
      400
    );
  }

  if (nextType === "CUSTOM" && nextIntervals.length === 0) {
    throw new AppError(
      "A custom availability override needs at least one interval.",
      400
    );
  }

  override.type = nextType;
  override.intervals = nextIntervals;

  if (data.reason !== undefined) {
    override.reason = data.reason;
  }

  await override.save();

  return override;
};

export const deleteAvailabilityOverride = async (
  organizationId,
  staffId,
  overrideId
) => {
  validateObjectId(overrideId);
  await ensureStaffExists(organizationId, staffId);

  const override = await AvailabilityOverride.findOneAndDelete({
    _id: overrideId,
    organization: organizationId,
    staff: staffId,
  });

  if (!override) {
    throw new AppError("Availability override not found.", 404);
  }

  return override;
};