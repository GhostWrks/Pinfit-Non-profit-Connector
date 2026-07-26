import { Router } from "express";
import { z } from "zod";

import { env } from "../config/env.js";
import { registrationCsvStore } from "../services/registrationCsvStore.js";
import { arcgisService } from "../services/arcgisService.js";

export const registrationsRouter = Router();

const boolLike = z.union([z.boolean(), z.string()]).transform((value) => {
  if (typeof value === "boolean") return value;
  const text = value.trim().toLowerCase();
  return text === "yes" || text === "true" || text === "1" || text === "y";
});

const registrationSchema = z.object({
  organizationName: z.string().trim().min(2),
  address: z.string().trim().min(3),
  city: z.string().trim().min(2),
  stateAbbreviation: z.string().trim().max(5).optional().default(""),
  zip: z.string().trim().min(3),
  industryDescription: z.string().trim().optional().default(""),
  employeeCount: z.union([z.string().trim(), z.number()]).optional().transform((v) => String(v ?? "")),
  esriCategoryDescription: z.string().trim().optional().default(""),
  missionArea: z.string().trim().min(2),
  mainContact: z.string().trim().optional().default(""),
  contactEmail: z.string().trim().optional().default(""),
  websiteLink: z.string().trim().optional().default(""),
  workingHours: z.string().trim().optional().default(""),
  matchedAddress: z.string().trim().optional().default(""),
  needVolunteers: boolLike.optional().default(false),
  foodYN: boolLike.optional().default(false),
  foodText: z.string().trim().optional().default(""),
  clothesYN: boolLike.optional().default(false),
  clothesText: z.string().trim().optional().default(""),
  shelterYN: boolLike.optional().default(false),
  shelterText: z.string().trim().optional().default(""),
  beddingYN: boolLike.optional().default(false),
  beddingText: z.string().trim().optional().default(""),
  toiletriesYN: boolLike.optional().default(false),
  toiletriesText: z.string().trim().optional().default(""),
  furnitureYN: boolLike.optional().default(false),
  furnitureText: z.string().trim().optional().default(""),
  medicalSuppliesYN: boolLike.optional().default(false),
  medicalSuppliesText: z.string().trim().optional().default(""),
  electronicsYN: boolLike.optional().default(false),
  electronicsText: z.string().trim().optional().default(""),
  educationMaterialsYN: boolLike.optional().default(false),
  educationMaterialsText: z.string().trim().optional().default(""),
  babyItemsYN: boolLike.optional().default(false),
  babyItemsText: z.string().trim().optional().default(""),
  cleaningItemsYN: boolLike.optional().default(false),
  cleaningItemsText: z.string().trim().optional().default(""),
  latitude: z.number().finite().optional(),
  longitude: z.number().finite().optional(),
  description: z.string().trim().optional().default("")
});

const yesNo = (value) => (value ? "Yes" : "No");

const toStorePayload = (payload) => ({
  organizationName: payload.organizationName,
  address: payload.address,
  city: payload.city,
  stateAbbreviation: payload.stateAbbreviation,
  zip: payload.zip,
  industryDescription: payload.industryDescription,
  employeeCount: payload.employeeCount,
  esriCategoryDescription: payload.esriCategoryDescription,
  missionArea: payload.missionArea,
  mainContact: payload.mainContact,
  contactEmail: payload.contactEmail,
  websiteLink: payload.websiteLink,
  workingHours: payload.workingHours,
  matchedAddress: payload.matchedAddress,
  needVolunteers: payload.needVolunteers,
  foodYN: yesNo(payload.foodYN),
  foodText: payload.foodText,
  clothesYN: yesNo(payload.clothesYN),
  clothesText: payload.clothesText,
  shelterYN: yesNo(payload.shelterYN),
  shelterText: payload.shelterText,
  beddingYN: yesNo(payload.beddingYN),
  beddingText: payload.beddingText,
  toiletriesYN: yesNo(payload.toiletriesYN),
  toiletriesText: payload.toiletriesText,
  furnitureYN: yesNo(payload.furnitureYN),
  furnitureText: payload.furnitureText,
  medicalSuppliesYN: yesNo(payload.medicalSuppliesYN),
  medicalSuppliesText: payload.medicalSuppliesText,
  electronicsYN: yesNo(payload.electronicsYN),
  electronicsText: payload.electronicsText,
  educationMaterialsYN: yesNo(payload.educationMaterialsYN),
  educationMaterialsText: payload.educationMaterialsText,
  babyItemsYN: yesNo(payload.babyItemsYN),
  babyItemsText: payload.babyItemsText,
  cleaningItemsYN: yesNo(payload.cleaningItemsYN),
  cleaningItemsText: payload.cleaningItemsText,
  latitude: payload.latitude,
  longitude: payload.longitude,
  description: payload.description
});

registrationsRouter.get("/", (req, res) => {
  const registrations = registrationCsvStore.readAll();
  return res.json({ registrations });
});

registrationsRouter.post("/", async (req, res, next) => {
  try {
    const parsed = registrationSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "Validation Error",
        message: parsed.error.issues[0]?.message || "Invalid registration payload"
      });
    }

    const payload = { ...parsed.data };

    if (!Number.isFinite(payload.latitude) || !Number.isFinite(payload.longitude)) {
      const geocoded = await arcgisService.geocodeAddress(
        `${payload.address}, ${payload.city}, ${payload.zip}`
      );

      if (geocoded) {
        payload.latitude = geocoded.lat;
        payload.longitude = geocoded.lon;
      }
    }

    if (!Number.isFinite(payload.latitude) || !Number.isFinite(payload.longitude)) {
      return res.status(400).json({
        error: "Validation Error",
        message: env.arcgisApiKey
          ? "Latitude/longitude are required or the address could not be geocoded"
          : "Latitude/longitude are required when ARCGIS_API_KEY is not configured"
      });
    }

    const registration = registrationCsvStore.append(toStorePayload(payload));

    return res.status(201).json({
      message: "Organization registration saved",
      registration
    });
  } catch (error) {
    return next(error);
  }
});

registrationsRouter.put("/:id", async (req, res, next) => {
  try {
    const parsed = registrationSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "Validation Error",
        message: parsed.error.issues[0]?.message || "Invalid registration payload"
      });
    }

    const payload = { ...parsed.data };

    if (!Number.isFinite(payload.latitude) || !Number.isFinite(payload.longitude)) {
      const geocoded = await arcgisService.geocodeAddress(
        `${payload.address}, ${payload.city}, ${payload.zip}`
      );

      if (geocoded) {
        payload.latitude = geocoded.lat;
        payload.longitude = geocoded.lon;
      }
    }

    if (!Number.isFinite(payload.latitude) || !Number.isFinite(payload.longitude)) {
      return res.status(400).json({
        error: "Validation Error",
        message: env.arcgisApiKey
          ? "Latitude/longitude are required or the address could not be geocoded"
          : "Latitude/longitude are required when ARCGIS_API_KEY is not configured"
      });
    }

    const updated = registrationCsvStore.update(req.params.id, toStorePayload(payload));
    if (!updated) {
      return res.status(404).json({
        error: "Not Found",
        message: "Registration not found"
      });
    }

    return res.json({
      message: "Organization registration updated",
      registration: updated
    });
  } catch (error) {
    return next(error);
  }
});
