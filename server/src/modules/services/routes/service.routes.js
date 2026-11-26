import { Router } from "express";

import authenticate from "../../../middleware/authenticate.js";
import requireOrganizationRole from "../../../middleware/requireOrganizationRole.js";
import validate from "../../../middleware/validate.js";

import {
  createServiceSchema,
  updateServiceSchema,
  serviceQuerySchema,
} from "../validators/service.validator.js";

import {
  createServiceController,
  getServicesController,
  getServiceController,
  updateServiceController,
  archiveServiceController,
} from "../controllers/service.controller.js";

const router = Router({
  mergeParams: true,
});

router.use(authenticate);

// Every route requires an active organization membership.
router.use(requireOrganizationRole());

// Validate query parameters and make the parsed values available
// to the controller.
router.use((req, res, next) => {
  const result = serviceQuerySchema.safeParse(req.query);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid query parameters.",
      errors: result.error.issues,
    });
  }

  req.validatedQuery = result.data;
  next();
});

// Read services: any active organization member.
router.get("/", getServicesController);
router.get("/:serviceId", getServiceController);

// Create, update and archive: Owner or Admin only.
router.post(
  "/",
  requireOrganizationRole("OWNER", "ADMIN"),
  validate(createServiceSchema),
  createServiceController
);

router.patch(
  "/:serviceId",
  requireOrganizationRole("OWNER", "ADMIN"),
  validate(updateServiceSchema),
  updateServiceController
);

router.delete(
  "/:serviceId",
  requireOrganizationRole("OWNER", "ADMIN"),
  archiveServiceController
);

export default router;