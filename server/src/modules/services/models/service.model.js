import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },

    category: {
      type: String,
      trim: true,
      maxlength: 80,
      default: "General",
    },

    durationMinutes: {
      type: Number,
      required: true,
      min: 15,
      max: 480,
      validate: {
        validator: Number.isInteger,
        message: "Duration must be a whole number of minutes.",
      },
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      uppercase: true,
      trim: true,
      default: "INR",
      minlength: 3,
      maxlength: 3,
    },

    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
      index: true,
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

serviceSchema.index({
  organization: 1,
  status: 1,
  category: 1,
});

serviceSchema.index({
  organization: 1,
  name: 1,
});

const Service = mongoose.model("Service", serviceSchema);

export default Service;