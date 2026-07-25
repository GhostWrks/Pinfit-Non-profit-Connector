import { z } from "zod";

const boolFromQuery = z
  .union([z.literal("true"), z.literal("false"), z.undefined()])
  .transform((value) => (value === undefined ? undefined : value === "true"));

const csvToArray = (value) => {
  if (!value) {
    return [];
  }

  return String(value)
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
};

export const donorSearchQuerySchema = z.object({
  locationQuery: z.string().min(2).max(120).optional(),
  keyword: z.string().min(2).max(120).optional(),
  zip: z.string().min(3).max(10).optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lon: z.coerce.number().min(-180).max(180).optional(),
  distanceMiles: z.coerce.number().min(1).max(25).optional(),
  needTypes: z.string().optional(),
  organizationTypes: z.string().optional(),
  volunteersNeeded: boolFromQuery,
  category: z.string().optional()
});

export const nonprofitLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export const nonprofitNeedsSchema = z.object({
  needs: z.array(z.string().min(2)).min(1),
  volunteersNeeded: z.boolean(),
  priority: z.enum(["low", "medium", "high"]),
  urgencyScore: z.number().min(1).max(100)
});

export const nonprofitProfileSchema = z.object({
  name: z.string().min(3).optional(),
  address: z.string().min(8).optional(),
  zip: z.string().min(3).max(10).optional(),
  mainContact: z.string().min(3).optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().min(7).optional(),
  hours: z.string().min(3).optional(),
  website: z.string().url().optional(),
  notes: z.string().max(500).optional(),
  category: z.string().min(2).optional(),
  organizationType: z.string().min(2).optional()
});

export const parseDonorSearchQuery = (query) => {
  const parsed = donorSearchQuerySchema.parse(query);
  return {
    ...parsed,
    needTypes: csvToArray(parsed.needTypes),
    organizationTypes: csvToArray(parsed.organizationTypes)
  };
};
