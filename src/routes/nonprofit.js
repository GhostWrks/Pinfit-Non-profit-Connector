import { Router } from "express";

import { requireNonprofitAuth } from "../middleware/auth.js";
import { arcgisService } from "../services/arcgisService.js";
import { dataStore } from "../services/dataStore.js";
import {
  nonprofitNeedsSchema,
  nonprofitProfileSchema
} from "../utils/validation.js";

export const nonprofitRouter = Router();

nonprofitRouter.use(requireNonprofitAuth);

nonprofitRouter.get("/me", (req, res) => {
  const organization = dataStore.getById(req.auth.orgId);

  if (!organization) {
    return res.status(404).json({
      error: "Not Found",
      message: "Organization not found"
    });
  }

  return res.json({
    organization,
    profileCompleteness: computeProfileCompleteness(organization)
  });
});

nonprofitRouter.put("/profile", async (req, res, next) => {
  try {
    const parsed = nonprofitProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "Validation Error",
        message: parsed.error.issues[0]?.message || "Invalid profile payload"
      });
    }

    const payload = { ...parsed.data };

    if (payload.address) {
      const geocoded = await arcgisService.geocodeAddress(payload.address);
      if (geocoded) {
        payload.location = { lat: geocoded.lat, lon: geocoded.lon };
      }
    }

    const updated = dataStore.updateProfile(req.auth.orgId, payload);

    if (!updated) {
      return res.status(404).json({
        error: "Not Found",
        message: "Organization not found"
      });
    }

    return res.json({
      message: "Profile updated",
      organization: updated
    });
  } catch (error) {
    return next(error);
  }
});

nonprofitRouter.put("/needs", (req, res) => {
  const parsed = nonprofitNeedsSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Validation Error",
      message: parsed.error.issues[0]?.message || "Invalid needs payload"
    });
  }

  const updated = dataStore.updateNeeds(req.auth.orgId, parsed.data);
  if (!updated) {
    return res.status(404).json({
      error: "Not Found",
      message: "Organization not found"
    });
  }

  return res.json({
    message: "Needs updated",
    organization: updated,
    visibility: "Public donor map can now reflect the updated needs"
  });
});

nonprofitRouter.get("/coverage", (req, res) => {
  const organization = dataStore.getById(req.auth.orgId);

  if (!organization) {
    return res.status(404).json({
      error: "Not Found",
      message: "Organization not found"
    });
  }

  const serviceRadiusMiles = 8;
  const serviceBuffer = arcgisService.getCrowFlyBuffer(
    organization.location,
    serviceRadiusMiles
  );

  const highDemandSignals = dataStore
    .queryNearby({ center: organization.location, distanceMiles: 25 })
    .filter((item) => item.urgencyScore >= 70)
    .map((item) => ({
      id: item.id,
      name: item.name,
      urgencyScore: item.urgencyScore,
      distanceMiles: item.distanceMiles
    }));

  return res.json({
    organization: {
      id: organization.id,
      name: organization.name,
      location: organization.location
    },
    serviceRadiusMiles,
    serviceBuffer,
    highDemandSignals,
    gapSuggestions: highDemandSignals
      .filter((item) => item.distanceMiles > 10)
      .slice(0, 3)
      .map((item) => ({
        focusArea: item.name,
        rationale: "High urgency and farther than current service radius"
      }))
  });
});

const computeProfileCompleteness = (organization) => {
  const requiredFields = [
    "name",
    "address",
    "mainContact",
    "contactEmail",
    "contactPhone",
    "hours",
    "website",
    "category",
    "organizationType"
  ];

  const filled = requiredFields.filter((field) => Boolean(organization[field])).length;
  return Math.round((filled / requiredFields.length) * 100);
};
