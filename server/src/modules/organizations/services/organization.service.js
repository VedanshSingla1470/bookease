
import mongoose from "mongoose";
import crypto from "node:crypto";

import Organization from "../models/organization.model.js";
import Membership from "../../memberships/models/membership.model.js";
import AppError from "../../../common/errors/AppError.js";

const createSlug = (name) => {
  const baseSlug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const suffix = crypto.randomBytes(3).toString("hex");

  return `${baseSlug}-${suffix}`;
};

const createOrganization = async (userId, organizationData) => {
  const session = await mongoose.startSession();

  let createdOrganization;

  try {
    await session.withTransaction(async () => {
      const [organization] = await Organization.create(
        [
          {
            ...organizationData,
            slug: createSlug(organizationData.name),
            createdBy: userId,
          },
        ],
        { session }
      );

      const [membership] = await Membership.create(
        [
          {
            organization: organization._id,
            user: userId,
            role: "OWNER",
            status: "ACTIVE",
          },
        ],
        { session }
      );

      createdOrganization = {
        organization,
        membership,
      };
    });

    return createdOrganization;
  } finally {
    await session.endSession();
  }
};

const getMyOrganizations = async (userId) => {
  const memberships = await Membership.find({
    user: userId,
    status: "ACTIVE",
  })
    .populate("organization")
    .sort({ createdAt: -1 });

  return memberships;
};

const getOrganizationById = async (organizationId) => {
  const organization = await Organization.findById(organizationId);

  if (!organization) {
    throw new AppError("Organization not found", 404);
  }

  return organization;
};

const updateOrganization = async (
  organizationId,
  updateData
) => {
  const organization = await Organization.findByIdAndUpdate(
    organizationId,
    { $set: updateData },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!organization) {
    throw new AppError("Organization not found", 404);
  }

  return organization;
};

export default {
  createOrganization,
  getMyOrganizations,
  getOrganizationById,
  updateOrganization,
};
