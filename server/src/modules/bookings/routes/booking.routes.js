import { Router } from "express";

import authenticate from "../../../middleware/authenticate.js";
import requireOrganizationRole from "../../../middleware/requireOrganizationRole.js";
import validate from "../../../middleware/validate.js";

import {
  availabilityQuerySchema,
  createBookingSchema,
  cancelBookingSchema,
  bookingListQuerySchema,
} from "../validators/booking.validator.js";

import {
  getAvailableSlotsController,
  createBookingController,
  getCustomerBookingsController,
  getOrganizationBookingsController,
  cancelBookingController,
} from "../controllers/booking.controller.js";

const router = Router({
  mergeParams: true,
});

router.use(authenticate);

const validateBookingQuery = (req, res, next) => {
  const result = bookingListQuerySchema.safeParse(req.query);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid booking query parameters.",
      errors: result.error.issues,
    });
  }

  req.validatedQuery = result.data;
  next();
};

// Customer-facing availability lookup.
router.get("/availability", (req, res, next) => {
  const result = availabilityQuerySchema.safeParse(req.query);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid availability query.",
      errors: result.error.issues,
    });
  }

  req.validatedQuery = result.data;
  next();
}, getAvailableSlotsController);

// Customer creates their own appointment.
router.post(
  "/",
  validate(createBookingSchema),
  createBookingController
);

// Customer views their own bookings.
router.get(
  "/my",
  validateBookingQuery,
  getCustomerBookingsController
);

// Customer cancels their own booking.
router.patch(
  "/:bookingId/cancel",
  validate(cancelBookingSchema),
  cancelBookingController
);

// Organization-facing booking management.
router.get(
  "/",
  requireOrganizationRole("OWNER", "ADMIN", "STAFF"),
  validateBookingQuery,
  getOrganizationBookingsController
);

export default router;