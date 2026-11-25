
import { Router } from "express";

import membershipController from "../controllers/membership.controller.js";

import {
  updateMemberRoleSchema,
} from "../validators/membership.validator.js";

import authenticate from "../../../middleware/authenticate.js";
import requireOrganizationRole from "../../../middleware/requireOrganizationRole.js";
import validate from "../../../middleware/validate.js";

const router = Router({ mergeParams: true });

// All membership management routes require authentication
router.use(authenticate);

// Only owners and admins can manage members
router.use(requireOrganizationRole("OWNER", "ADMIN"));

// Get organization members
router.get(
  "/",
  membershipController.getMembers
);

// Update a member's role
router.patch(
  "/:membershipId/role",
  validate(updateMemberRoleSchema),
  membershipController.updateMemberRole
);

// Remove a member
router.delete(
  "/:membershipId",
  membershipController.removeMember
);

export default router;
