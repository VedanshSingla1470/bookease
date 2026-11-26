import { z } from "zod";

export const createStaffSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email()
    .max(255),

  jobTitle: z
    .string()
    .trim()
    .max(100)
    .optional(),

  bio: z
    .string()
    .trim()
    .max(1000)
    .optional(),

  specialties: z
    .array(
      z.string().trim().min(1).max(80)
    )
    .max(20)
    .optional(),

  calendarColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
});

export const updateStaffSchema = z
  .object({
    jobTitle: z
      .string()
      .trim()
      .max(100)
      .optional(),

    bio: z
      .string()
      .trim()
      .max(1000)
      .optional(),

    specialties: z
      .array(
        z.string().trim().min(1).max(80)
      )
      .max(20)
      .optional(),

    calendarColor: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/)
      .optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    {
      message: "At least one field must be provided.",
    }
  );

export const staffQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),

  limit: z.coerce.number().int().min(1).max(100).default(10),

  status: z
    .enum(["ACTIVE", "INACTIVE", "ALL"])
    .default("ACTIVE"),

  search: z.string().trim().max(120).optional(),
});

export const updateStaffStatusSchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE"]),
});