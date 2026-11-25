
import mongoose from "mongoose";

import Membership from "../modules/memberships/models/membership.model.js";
import AppError from "../common/errors/AppError.js";

const requireOrganizationRole = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      const { organizationId } = req.params;

      if (!mongoose.isValidObjectId(organizationId)) {
        throw new AppError("Invalid organization ID", 400);
      }

      const membership = await Membership.findOne({
        organization: organizationId,
        user: req.user.id,
        status: "ACTIVE",
      }).populate("organization");

      if (!membership || !membership.organization) {
        throw new AppError(
          "You are not a member of this organization",
          403
        );
      }

      if (membership.organization.status !== "ACTIVE") {
        throw new AppError("Organization is not active", 403);
      }

      if (
        allowedRoles.length > 0 &&
        !allowedRoles.includes(membership.role)
      ) {
        throw new AppError(
          "You do not have permission to perform this action",
          403
        );
      }

      req.membership = membership;
      req.organization = membership.organization;

      next();
    } catch (error) {
      next(error);
    }
  };
};

export default requireOrganizationRole;
