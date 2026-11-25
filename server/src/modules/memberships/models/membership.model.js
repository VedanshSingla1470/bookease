
import mongoose from "mongoose";

const membershipSchema = new mongoose.Schema(
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

    role: {
      type: String,
      enum: ["OWNER", "ADMIN", "STAFF"],
      required: true,
      default: "STAFF",
    },

    status: {
      type: String,
      enum: ["ACTIVE", "INVITED", "SUSPENDED"],
      default: "ACTIVE",
    },

    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

membershipSchema.index(
  { organization: 1, user: 1 },
  { unique: true }
);

membershipSchema.index({ user: 1, status: 1 });

const Membership = mongoose.model(
  "Membership",
  membershipSchema
);

export default Membership;
