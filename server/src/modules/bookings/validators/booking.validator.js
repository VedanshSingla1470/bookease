import { z } from "zod";

const objectIdSchema = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "Invalid ID.");

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));

    return (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
    );
  }, "Invalid calendar date.");

export const availabilityQuerySchema = z.object({
  serviceId: objectIdSchema,
  staffId: objectIdSchema,
  date: dateSchema,
});

export const createBookingSchema = z.object({
  serviceId: objectIdSchema,
  staffId: objectIdSchema,

  // ISO timestamp returned by the availability endpoint.
  startAt: z.string().datetime({ offset: true }),

  customerNotes: z.string().trim().max(1000).optional(),
});

export const cancelBookingSchema = z.object({
  reason: z.string().trim().max(500).optional(),
});

export const bookingListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),

  status: z
    .enum([
      "CONFIRMED",
      "CANCELLED",
      "COMPLETED",
      "NO_SHOW",
      "ALL",
    ])
    .default("ALL"),

  from: z.string().datetime({ offset: true }).optional(),
  to: z.string().datetime({ offset: true }).optional(),
}).refine(
  (query) => !query.from || !query.to ||
    new Date(query.from) <= new Date(query.to),
  {
    message: "'from' must be before or equal to 'to'.",
    path: ["to"],
  }
);