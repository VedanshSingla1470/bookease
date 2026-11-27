import {
  getWeeklySchedule,
  updateWeeklySchedule,
  getAvailabilityOverrides,
  createAvailabilityOverride,
  updateAvailabilityOverride,
  deleteAvailabilityOverride,
} from "../services/availability.service.js";

export const getWeeklyScheduleController = async (req, res) => {
  const schedule = await getWeeklySchedule(
    req.organization._id,
    req.params.staffId
  );

  res.status(200).json({
    success: true,
    data: schedule,
  });
};

export const updateWeeklyScheduleController = async (req, res) => {
  const schedule = await updateWeeklySchedule(
    req.organization._id,
    req.params.staffId,
    req.user.id,
    req.organization.timezone,
    req.body.days
  );

  res.status(200).json({
    success: true,
    message: "Weekly schedule saved successfully.",
    data: schedule,
  });
};

export const getAvailabilityOverridesController = async (
  req,
  res
) => {
  const overrides = await getAvailabilityOverrides(
    req.organization._id,
    req.params.staffId,
    req.validatedQuery.from,
    req.validatedQuery.to
  );

  res.status(200).json({
    success: true,
    data: overrides,
  });
};

export const createAvailabilityOverrideController = async (
  req,
  res
) => {
  const override = await createAvailabilityOverride(
    req.organization._id,
    req.params.staffId,
    req.user.id,
    req.body
  );

  res.status(201).json({
    success: true,
    message: "Availability override created successfully.",
    data: override,
  });
};

export const updateAvailabilityOverrideController = async (
  req,
  res
) => {
  const override = await updateAvailabilityOverride(
    req.organization._id,
    req.params.staffId,
    req.params.overrideId,
    req.body
  );

  res.status(200).json({
    success: true,
    message: "Availability override updated successfully.",
    data: override,
  });
};

export const deleteAvailabilityOverrideController = async (
  req,
  res
) => {
  await deleteAvailabilityOverride(
    req.organization._id,
    req.params.staffId,
    req.params.overrideId
  );

  res.status(200).json({
    success: true,
    message: "Availability override deleted successfully.",
  });
};