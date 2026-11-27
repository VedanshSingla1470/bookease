import mongoose from "mongoose";

const bookingSlotSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },

    staff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      required: true,
    },

    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },

    slotStart: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

bookingSlotSchema.index(
  {
    organization: 1,
    staff: 1,
    slotStart: 1,
  },
  {
    unique: true,
  }
);

bookingSlotSchema.index({
  booking: 1,
});

const BookingSlot = mongoose.model(
  "BookingSlot",
  bookingSlotSchema
);

export default BookingSlot;