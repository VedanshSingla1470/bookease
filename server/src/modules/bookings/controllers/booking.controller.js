import {
  getAvailableSlotsForService,
  createBooking,
  getCustomerBookings,
  getOrganizationBookings,
  cancelBooking,
} from "../services/booking.service.js";

export const getAvailableSlotsController = async (req, res) => {
  const result = await getAvailableSlotsForService(
    req.params.organizationId,
    req.validatedQuery.serviceId,
    req.validatedQuery.staffId,
    req.validatedQuery.date
  );

  res.status(200).json({
    success: true,
    data: result,
  });
};

export const createBookingController = async (req, res) => {
  const booking = await createBooking(
    req.params.organizationId,
    req.user.id,
    req.body
  );

  res.status(201).json({
    success: true,
    message: "Appointment booked successfully.",
    data: booking,
  });
};

export const getCustomerBookingsController = async (req, res) => {
  const result = await getCustomerBookings(
  req.params.organizationId,
  req.user.id,
  req.validatedQuery
);

  res.status(200).json({
    success: true,
    data: result.bookings,
    pagination: result.pagination,
  });
};

export const getOrganizationBookingsController = async (
  req,
  res
) => {
  const result = await getOrganizationBookings(
    req.organization._id,
    req.validatedQuery
  );

  res.status(200).json({
    success: true,
    data: result.bookings,
    pagination: result.pagination,
  });
};

export const cancelBookingController = async (req, res) => {
  const booking = await cancelBooking(
  req.params.organizationId,
  req.params.bookingId,
  req.user.id,
  req.body.reason
);

  res.status(200).json({
    success: true,
    message: "Appointment cancelled successfully.",
    data: booking,
  });
};