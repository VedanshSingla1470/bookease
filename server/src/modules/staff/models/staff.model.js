import mongoose from "mongoose";

const staffSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    jobTitle: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },

    bio: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },

    specialties: {
      type: [String],
      default: [],
    },

    calendarColor: {
      type: String,
      default: "#2563EB",
      match: /^#[0-9A-Fa-f]{6}$/,
    },

    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
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

staffSchema.index(
  { organization: 1, user: 1 },
  { unique: true }
);

staffSchema.index({
  organization: 1,
  status: 1,
});

const Staff = mongoose.model("Staff", staffSchema);

export default Staff;