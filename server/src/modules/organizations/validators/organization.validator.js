
import { z } from "zod";

const addressSchema = z.object({
  addressLine1: z.string().trim().max(150).optional(),
  addressLine2: z.string().trim().max(150).optional(),
  city: z.string().trim().max(100).optional(),
  state: z.string().trim().max(100).optional(),
  postalCode: z.string().trim().max(20).optional(),
  country: z.string().trim().max(100).optional(),
}).optional();

export const createOrganizationSchema = z.object({
  name: z.string().trim().min(2).max(100),

  description: z.string().trim().max(1000).optional(),

  industry: z.string().trim().max(100).optional(),

  contactEmail: z.string().trim().toLowerCase().email().optional(),

  phone: z.string().trim().max(30).optional(),

  website: z.string().trim().url().optional(),

  address: addressSchema,

  timezone: z.string().trim().min(1).max(100).optional(),
});

export const updateOrganizationSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),

  description: z.string().trim().max(1000).optional(),

  industry: z.string().trim().max(100).optional(),

  contactEmail: z.string().trim().toLowerCase().email().optional(),

  phone: z.string().trim().max(30).optional(),

  website: z.string().trim().url().optional(),

  address: addressSchema,

  timezone: z.string().trim().min(1).max(100).optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field must be provided" }
);
