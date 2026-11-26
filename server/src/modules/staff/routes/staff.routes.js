import { Router } from "express";

import authenticate from "../../../middleware/authenticate.js";
import requireOrganizationRole from "../../../middleware/requireOrganizationRole.js";
import validate from "../../../middleware/validate.js";

import {
  createStaffSchema,
  updateStaffSchema,
  staffQuerySchema,
  updateStaffStatusSchema,
} from "../validators/staff.validator.js";

import {
  createStaffController,
  getStaffController,
  getStaffMemberController,
  updateStaffController,
  updateStaffStatusController,
} from "../controllers/staff.controller.js";

const router = Router({
  mergeParams: true,
});

router.use(authenticate);

// All routes require active membership in this organization.
router.use(requireOrganizationRole());

// Read operations: all active organization members.
router.get("/", (req, res, next) => {
  const result = staffQuerySchema.safeParse(req.query);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid query parameters.",
      errors: result.error.issues,
    });
  }

  req.validatedQuery = result.data;
  next();
}, getStaffController);

router.get("/:staffId", getStaffMemberController);

// Write operations: Owner and Admin only.
router.post(
  "/",
  requireOrganizationRole("OWNER", "ADMIN"),
  validate(createStaffSchema),
  createStaffController
);

router.patch(
  "/:staffId",
  requireOrganizationRole("OWNER", "ADMIN"),
  validate(updateStaffSchema),
  updateStaffController
);

router.patch(
  "/:staffId/status",
  requireOrganizationRole("OWNER", "ADMIN"),
  validate(updateStaffStatusSchema),
  updateStaffStatusController
);

export default router;