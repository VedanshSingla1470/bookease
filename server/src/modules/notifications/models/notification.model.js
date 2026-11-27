
import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    recipientEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    recipientName: {
      type: String,
      default: "",
    },
    type: {
      type: String,
      enum: [
        "BOOKING_CONFIRMED",
        "BOOKING_CANCELLED",
        "BOOKING_REMINDER",
      ],
      required: true,
    },
    channel: {
      type: String,
      enum: ["EMAIL"],
      default: "EMAIL",
    },
    status: {
      type: String,
      enum: ["PENDING", "PROCESSING", "SENT", "FAILED"],
      default: "PENDING",
      index: true,
    },
    subject: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    html: {
      type: String,
      required: true,
    },
    scheduledFor: {
      type: Date,
      default: Date.now,
      index: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    maxAttempts: {
      type: Number,
      default: 3,
    },
    nextAttemptAt: {
      type: Date,
      default: Date.now,
    },
    processingAt: Date,
    sentAt: Date,
    lastError: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

// A booking can have only one email of each notification type.
notificationSchema.index(
  { booking: 1, type: 1, channel: 1 },
  { unique: true }
);

notificationSchema.index({
  organization: 1,
  createdAt: -1,
});

export default mongoose.model("Notification", notificationSchema);
