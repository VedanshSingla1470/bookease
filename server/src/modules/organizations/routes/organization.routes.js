
import { Router } from "express";

import organizationController from "../controllers/organization.controller.js";

import {
  createOrganizationSchema,
  updateOrganizationSchema,
} from "../validators/organization.validator.js";

import validate from "../../../middleware/validate.js";
import authenticate from "../../../middleware/authenticate.js";
import requireOrganizationRole from "../../../middleware/requireOrganizationRole.js";

const router = Router();

// All organization routes require authentication
router.use(authenticate);

// Create an organization
router.post(
  "/",
  validate(createOrganizationSchema),
  organizationController.createOrganization
);

// Get organizations belonging to current user
router.get(
  "/",
  organizationController.getMyOrganizations
);

// Get a particular organization
router.get(
  "/:organizationId",
  requireOrganizationRole("OWNER", "ADMIN", "STAFF"),
  organizationController.getOrganization
);

// Update an organization
router.patch(
  "/:organizationId",
  requireOrganizationRole("OWNER", "ADMIN"),
  validate(updateOrganizationSchema),
  organizationController.updateOrganization
);

export default router;
