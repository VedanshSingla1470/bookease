import { z } from "zod";

const timeSchema = z.string().regex(
  /^([01]\d|2[0-3]):[0-5]\d$/,
  "Time must use HH:mm format."
);

const intervalSchema = z
  .object({
    startTime: timeSchema,
    endTime: timeSchema,
  })
  .refine(
    (interval) => interval.startTime < interval.endTime,
    {
      message: "End time must be after start time.",
      path: ["endTime"],
    }
  );

const validateIntervals = (intervals, ctx) => {
  const sorted = [...intervals].sort((a, b) =>
    a.startTime.localeCompare(b.startTime)
  );

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].startTime < sorted[i - 1].endTime) {
      ctx.addIssue({
        code: "custom",
        message: "Working intervals must not overlap.",
      });

      break;
    }
  }
};

const dayScheduleSchema = z
  .object({
    dayOfWeek: z.number().int().min(0).max(6),

    isWorkingDay: z.boolean(),

    intervals: z.array(intervalSchema).max(10),
  })
  .superRefine((day, ctx) => {
    if (day.isWorkingDay && day.intervals.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["intervals"],
        message: "A working day must have at least one interval.",
      });
    }

    if (!day.isWorkingDay && day.intervals.length > 0) {
      ctx.addIssue({
        code: "custom",
        path: ["intervals"],
        message: "A non-working day cannot have intervals.",
      });
    }

    validateIntervals(day.intervals, ctx);
  });

export const weeklyScheduleSchema = z
  .object({
    days: z.array(dayScheduleSchema).length(7),
  })
  .superRefine((schedule, ctx) => {
    const days = schedule.days.map((day) => day.dayOfWeek);

    if (new Set(days).size !== 7) {
      ctx.addIssue({
        code: "custom",
        path: ["days"],
        message: "Each day of the week must appear exactly once.",
      });
    }
  });

const isValidCalendarDate = (value) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) return false;

  const [, year, month, day] = match;
  const date = new Date(Date.UTC(+year, +month - 1, +day));

  return (
    date.getUTCFullYear() === +year &&
    date.getUTCMonth() === +month - 1 &&
    date.getUTCDate() === +day
  );
};

const dateSchema = z
  .string()
  .refine(isValidCalendarDate, "Provide a valid date in YYYY-MM-DD format.");

export const createOverrideSchema = z
  .object({
    date: dateSchema,

    type: z.enum(["CLOSED", "CUSTOM"]),

    intervals: z.array(intervalSchema).max(10).default([]),

    reason: z.string().trim().max(250).optional(),
  })
  .superRefine((override, ctx) => {
    if (override.type === "CUSTOM" && override.intervals.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["intervals"],
        message: "A custom availability override needs at least one interval.",
      });
    }

    if (override.type === "CLOSED" && override.intervals.length > 0) {
      ctx.addIssue({
        code: "custom",
        path: ["intervals"],
        message: "A closed day cannot contain working intervals.",
      });
    }

    validateIntervals(override.intervals, ctx);
  });

export const updateOverrideSchema = z
  .object({
    type: z.enum(["CLOSED", "CUSTOM"]).optional(),

    intervals: z.array(intervalSchema).max(10).optional(),

    reason: z.string().trim().max(250).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided.",
  })
  .superRefine((override, ctx) => {
    if (
      override.type === "CUSTOM" &&
      (!override.intervals || override.intervals.length === 0)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["intervals"],
        message: "A custom availability override needs at least one interval.",
      });
    }

    if (
      override.type === "CLOSED" &&
      override.intervals?.length > 0
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["intervals"],
        message: "A closed day cannot contain working intervals.",
      });
    }

    if (override.intervals) {
      validateIntervals(override.intervals, ctx);
    }
  });

export const overrideQuerySchema = z
  .object({
    from: dateSchema,
    to: dateSchema,
  })
  .refine((query) => query.from <= query.to, {
    message: "'from' must be on or before 'to'.",
    path: ["to"],
  });