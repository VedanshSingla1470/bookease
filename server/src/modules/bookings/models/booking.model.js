import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    staff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      required: true,
    },

    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    },

    serviceSnapshot: {
      name: {
        type: String,
        required: true,
      },
      durationMinutes: {
        type: Number,
        required: true,
      },
      price: {
        type: Number,
        required: true,
      },
      currency: {
        type: String,
        required: true,
      },
    },

    startAt: {
      type: Date,
      required: true,
    },

    endAt: {
      type: Date,
      required: true,
    },

    timezone: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: [
        "CONFIRMED",
        "CANCELLED",
        "COMPLETED",
        "NO_SHOW",
      ],
      default: "CONFIRMED",
      index: true,
    },

    customerNotes: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },

    cancelledAt: {
      type: Date,
      default: null,
    },

    cancellationReason: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

bookingSchema.index({
  organization: 1,
  startAt: 1,
});

bookingSchema.index({
  customer: 1,
  createdAt: -1,
});

bookingSchema.index({
  staff: 1,
  startAt: 1,
  status: 1,
});

const Booking = mongoose.model("Booking", bookingSchema);

export default Booking;