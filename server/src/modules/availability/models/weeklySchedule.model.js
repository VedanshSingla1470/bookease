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

const dayScheduleSchema = new mongoose.Schema(
  {
    dayOfWeek: {
      type: Number,
      required: true,
      min: 0,
      max: 6,
    },

    isWorkingDay: {
      type: Boolean,
      required: true,
      default: false,
    },

    intervals: {
      type: [timeIntervalSchema],
      default: [],
    },
  },
  {
    _id: false,
  }
);

const weeklyScheduleSchema = new mongoose.Schema(
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

    days: {
      type: [dayScheduleSchema],
      required: true,
      validate: {
        validator(days) {
          return (
            days.length === 7 &&
            new Set(days.map((day) => day.dayOfWeek)).size === 7
          );
        },
        message: "A weekly schedule must contain all seven unique days.",
      },
    },

    timezone: {
      type: String,
      required: true,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

weeklyScheduleSchema.index(
  { organization: 1, staff: 1 },
  { unique: true }
);

const WeeklySchedule = mongoose.model(
  "WeeklySchedule",
  weeklyScheduleSchema
);

export default WeeklySchedule;