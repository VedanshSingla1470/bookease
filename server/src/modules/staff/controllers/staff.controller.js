import {
  createStaff,
  getOrganizationStaff,
  getStaffById,
  updateStaff,
  updateStaffStatus,
} from "../services/staff.service.js";

export const createStaffController = async (req, res) => {
  const staff = await createStaff(
    req.organization._id,
    req.user.id,
    req.body
  );

  res.status(201).json({
    success: true,
    message: "Staff member added successfully.",
    data: staff,
  });
};

export const getStaffController = async (req, res) => {
  const result = await getOrganizationStaff(
    req.organization._id,
    req.validatedQuery
  );

  res.status(200).json({
    success: true,
    data: result.staff,
    pagination: result.pagination,
  });
};

export const getStaffMemberController = async (req, res) => {
  const staff = await getStaffById(
    req.organization._id,
    req.params.staffId
  );

  res.status(200).json({
    success: true,
    data: staff,
  });
};

export const updateStaffController = async (req, res) => {
  const staff = await updateStaff(
    req.organization._id,
    req.params.staffId,
    req.body
  );

  res.status(200).json({
    success: true,
    message: "Staff profile updated successfully.",
    data: staff,
  });
};

export const updateStaffStatusController = async (req, res) => {
  const staff = await updateStaffStatus(
    req.organization._id,
    req.params.staffId,
    req.body.status
  );

  res.status(200).json({
    success: true,
    message: `Staff member ${req.body.status.toLowerCase()} successfully.`,
    data: staff,
  });
};