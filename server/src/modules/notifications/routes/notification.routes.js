
import { Router } from "express";

import authenticate from "../../../middleware/authenticate.js";
import validate from "../../../middleware/validate.js";
import requireOrganizationRole from "../../../middleware/requireOrganizationRole.js";

import {
  getMyNotifications,
  getOrganizationNotificationsController,
} from "../controllers/notification.controller.js";

import {
  notificationQuerySchema,
} from "../validators/notification.validator.js";

const router = Router({ mergeParams: true });

router.use(authenticate);

// Customers can see their own notification history.
router.get(
  "/my",
  validate(notificationQuerySchema, "query"),
  getMyNotifications
);

// Organization members with management access can see the organization's
// notification delivery history.
router.get(
  "/",
  requireOrganizationRole("OWNER", "ADMIN"),
  validate(notificationQuerySchema, "query"),
  getOrganizationNotificationsController
);

export default router;
