import mongoose from "mongoose";

const timeIntervalSchema = new mongoose.Schema(
  {
    startTime: {
      type: String,
      required: true,
    },

    endTime: {
      type: String,
      required: true,
    },
  },
  {
    _id: false,
  }
);

const availabilityOverrideSchema = new mongoose.Schema(
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

    // Local calendar date in the organization's timezone.
    date: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },

    type: {
      type: String,
      enum: ["CLOSED", "CUSTOM"],
      required: true,
    },

    intervals: {
      type: [timeIntervalSchema],
      default: [],
    },

    reason: {
      type: String,
      trim: true,
      maxlength: 250,
      default: "",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

availabilityOverrideSchema.index(
  { organization: 1, staff: 1, date: 1 },
  { unique: true }
);

const AvailabilityOverride = mongoose.model(
  "AvailabilityOverride",
  availabilityOverrideSchema
);

export default AvailabilityOverride;