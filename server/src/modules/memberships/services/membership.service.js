
import mongoose from "mongoose";

import Membership from "../models/membership.model.js";
import AppError from "../../../common/errors/AppError.js";

const getOrganizationMembers = async (organizationId) => {
  const members = await Membership.find({
    organization: organizationId,
    status: "ACTIVE",
  })
    .populate("user", "firstName lastName email")
    .sort({ createdAt: 1 });

  return members;
};

const updateMemberRole = async (
  organizationId,
  membershipId,
  actorRole,
  newRole
) => {
  if (!mongoose.isValidObjectId(membershipId)) {
    throw new AppError("Invalid membership ID", 400);
  }

  const targetMembership = await Membership.findOne({
    _id: membershipId,
    organization: organizationId,
    status: "ACTIVE",
  });

  if (!targetMembership) {
    throw new AppError("Membership not found", 404);
  }

  if (targetMembership.role === "OWNER") {
    throw new AppError("Owner role cannot be changed here", 403);
  }

  if (
  actorRole === "ADMIN" &&
  (targetMembership.role !== "STAFF" || newRole !== "STAFF")
) {
  throw new AppError(
    "Admins can only manage staff members",
    403
  );
}

  targetMembership.role = newRole;

  await targetMembership.save();

  return targetMembership;
};

const removeMember = async (
  organizationId,
  membershipId,
  actorUserId,
  actorRole
) => {
  if (!mongoose.isValidObjectId(membershipId)) {
    throw new AppError("Invalid membership ID", 400);
  }

  const targetMembership = await Membership.findOne({
    _id: membershipId,
    organization: organizationId,
    status: "ACTIVE",
  });

  if (!targetMembership) {
    throw new AppError("Membership not found", 404);
  }

  if (targetMembership.user.toString() === actorUserId) {
    throw new AppError(
      "You cannot remove yourself through this endpoint",
      403
    );
  }

  if (targetMembership.role === "OWNER") {
    throw new AppError(
      "An owner cannot be removed through this endpoint",
      403
    );
  }

  if (actorRole === "ADMIN" && targetMembership.role !== "STAFF") {
    throw new AppError(
      "Admins can only remove staff members",
      403
    );
  }

  await targetMembership.deleteOne();

  return targetMembership;
};

export default {
  getOrganizationMembers,
  updateMemberRole,
  removeMember,
};
