import { Router } from "express";

import authenticate from "../../../middleware/authenticate.js";
import requireOrganizationRole from "../../../middleware/requireOrganizationRole.js";
import validate from "../../../middleware/validate.js";

import {
  weeklyScheduleSchema,
  createOverrideSchema,
  updateOverrideSchema,
  overrideQuerySchema,
} from "../validators/availability.validator.js";

import {
  getWeeklyScheduleController,
  updateWeeklyScheduleController,
  getAvailabilityOverridesController,
  createAvailabilityOverrideController,
  updateAvailabilityOverrideController,
  deleteAvailabilityOverrideController,
} from "../controllers/availability.controller.js";

const router = Router({
  mergeParams: true,
});

router.use(authenticate);

// All operations require active membership in the organization.
router.use(requireOrganizationRole());

// Read weekly schedule.
router.get(
  "/weekly",
  getWeeklyScheduleController
);

// Read date-specific overrides.
router.get(
  "/overrides",
  (req, res, next) => {
    const result = overrideQuerySchema.safeParse(req.query);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid date range.",
        errors: result.error.issues,
      });
    }

    req.validatedQuery = result.data;
    next();
  },
  getAvailabilityOverridesController
);

// Write operations: Owner and Admin only.
router.put(
  "/weekly",
  requireOrganizationRole("OWNER", "ADMIN"),
  validate(weeklyScheduleSchema),
  updateWeeklyScheduleController
);

router.post(
  "/overrides",
  requireOrganizationRole("OWNER", "ADMIN"),
  validate(createOverrideSchema),
  createAvailabilityOverrideController
);

router.patch(
  "/overrides/:overrideId",
  requireOrganizationRole("OWNER", "ADMIN"),
  validate(updateOverrideSchema),
  updateAvailabilityOverrideController
);

router.delete(
  "/overrides/:overrideId",
  requireOrganizationRole("OWNER", "ADMIN"),
  deleteAvailabilityOverrideController
);

export default router;