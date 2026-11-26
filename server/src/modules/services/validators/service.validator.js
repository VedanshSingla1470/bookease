import { z } from "zod";

const serviceFields = {
  name: z.string().trim().min(2).max(120),

  description: z.string().trim().max(1000).optional(),

  category: z.string().trim().min(2).max(80).optional(),

  durationMinutes: z
    .number()
    .int()
    .min(15)
    .max(480)
    .refine((value) => value % 15 === 0, {
      message: "Duration must be a multiple of 15 minutes.",
    }),

  price: z.number().min(0),

  currency: z
    .string()
    .trim()
    .length(3)
    .transform((value) => value.toUpperCase())
    .optional(),
};

export const createServiceSchema = z.object(serviceFields);

export const updateServiceSchema = z
  .object({
    name: serviceFields.name.optional(),
    description: serviceFields.description,
    category: serviceFields.category,
    durationMinutes: serviceFields.durationMinutes.optional(),
    price: serviceFields.price.optional(),
    currency: serviceFields.currency,
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided.",
  });

export const serviceQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),

  status: z.enum(["ACTIVE", "INACTIVE", "ALL"]).default("ACTIVE"),

  category: z.string().trim().optional(),

  search: z.string().trim().max(120).optional(),
});