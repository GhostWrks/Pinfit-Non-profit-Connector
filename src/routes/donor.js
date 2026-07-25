import { Router } from "express";

import { env } from "../config/env.js";
import { dataStore } from "../services/dataStore.js";
import { arcgisService } from "../services/arcgisService.js";
import { parseDonorSearchQuery } from "../utils/validation.js";

export const donorRouter = Router();

const topNeedTypes = (rows) => {
  const counts = new Map();

  rows.forEach((row) => {
    row.needs.forEach((need) => {
      const key = need.toLowerCase();
      counts.set(key, (counts.get(key) || 0) + 1);
    });
  });

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([need, count]) => ({ need, count }));
};

donorRouter.get("/search", async (req, res, next) => {
  try {
    const query = parseDonorSearchQuery(req.query);
    const locationQuery = String(query.locationQuery || "").trim();
    const keyword = String(query.keyword || "").trim();

    const zipFromLocationQuery = /^\d{5}(-\d{4})?$/.test(locationQuery)
      ? locationQuery.slice(0, 5)
      : null;

    let center =
      typeof query.lat === "number" && typeof query.lon === "number"
        ? { lat: query.lat, lon: query.lon }
        : null;

    if (!center && locationQuery) {
      const geocoded = await arcgisService.geocodeAddress(locationQuery);
      if (geocoded) {
        center = { lat: geocoded.lat, lon: geocoded.lon };
      }
    }

    const distanceMiles = query.distanceMiles || env.defaultSearchRadiusMiles;
    const textQuery = keyword || (!center ? locationQuery : "");

    const rows = dataStore.queryNearby({
      center,
      zip: query.zip || zipFromLocationQuery,
      textQuery,
      distanceMiles,
      needTypes: query.needTypes,
      organizationTypes: query.organizationTypes,
      volunteersNeeded: query.volunteersNeeded,
      category: query.category
    });

    const summary = {
      organizationsInView: rows.length,
      topRequestedNeeds: topNeedTypes(rows),
      volunteerNeededCount: rows.filter((item) => item.volunteersNeeded).length,
      highNeedNeighborhoodsNearby: rows
        .filter((item) => item.urgencyScore >= 75)
        .slice(0, 3)
        .map((item) => ({
          name: item.name,
          urgencyScore: item.urgencyScore,
          zip: item.zip
        }))
    };

    const buffer = center
      ? arcgisService.getCrowFlyBuffer(center, distanceMiles)
      : null;

    return res.json({
      query: {
        ...query,
        keyword,
        locationQuery,
        textQuery,
        effectiveCenter: center,
        distanceMiles
      },
      summary,
      buffer,
      results: rows
    });
  } catch (error) {
    return next(error);
  }
});

donorRouter.get("/:id", (req, res) => {
  const org = dataStore.getById(req.params.id);
  if (!org) {
    return res.status(404).json({
      error: "Not Found",
      message: "Nonprofit not found"
    });
  }

  return res.json(org);
});

donorRouter.get("/:id/route", async (req, res, next) => {
  try {
    const org = dataStore.getById(req.params.id);
    if (!org) {
      return res.status(404).json({
        error: "Not Found",
        message: "Nonprofit not found"
      });
    }

    const originLat = Number(req.query.originLat);
    const originLon = Number(req.query.originLon);
    const mode = String(req.query.mode || "drive-time");

    if (!Number.isFinite(originLat) || !Number.isFinite(originLon)) {
      return res.status(400).json({
        error: "Validation Error",
        message: "originLat and originLon are required"
      });
    }

    const route = await arcgisService.getRouteSummary(
      { lat: originLat, lon: originLon },
      org.location,
      mode
    );

    return res.json({
      nonprofitId: org.id,
      nonprofitName: org.name,
      route
    });
  } catch (error) {
    return next(error);
  }
});
