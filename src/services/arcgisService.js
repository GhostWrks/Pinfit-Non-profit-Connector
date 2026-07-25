import {
  geocode,
  suggest,
  reverseGeocode
} from "@esri/arcgis-rest-geocoding";
import { solveRoute } from "@esri/arcgis-rest-routing";
import { ApiKeyManager, request } from "@esri/arcgis-rest-request";

import { env } from "../config/env.js";
import { buildSimpleBuffer } from "../utils/geo.js";

const authentication = env.arcgisApiKey
  ? ApiKeyManager.fromKey(env.arcgisApiKey)
  : null;

const authOptions = authentication ? { authentication } : {};

export const arcgisService = {
  async geocodeAddress(address) {
    if (!env.arcgisApiKey) {
      return null;
    }

    const response = await geocode({
      params: { singleLine: address, outFields: "*" },
      ...authOptions
    });

    const top = response.candidates?.[0];
    if (!top?.location) {
      return null;
    }

    return {
      lat: top.location.y,
      lon: top.location.x,
      score: top.score
    };
  },

  async suggestAddress(text) {
    if (!env.arcgisApiKey) {
      return [];
    }

    const response = await suggest({
      text,
      ...authOptions
    });

    return response.suggestions || [];
  },

  async reverseLookup(point) {
    if (!env.arcgisApiKey) {
      return null;
    }

    const response = await reverseGeocode({
      params: {
        location: {
          x: point.lon,
          y: point.lat,
          spatialReference: { wkid: 4326 }
        }
      },
      ...authOptions
    });

    return response.address || null;
  },

  getCrowFlyBuffer(center, radiusMiles) {
    return buildSimpleBuffer(center, radiusMiles);
  },

  async getRouteSummary(origin, destination, mode = "drive-time") {
    if (!env.arcgisApiKey) {
      return {
        mode,
        estimatedMinutes: null,
        estimatedMiles: null,
        message: "Routing unavailable because ARCGIS_API_KEY is not configured"
      };
    }

    const response = await solveRoute({
      stops: [
        [origin.lon, origin.lat],
        [destination.lon, destination.lat]
      ],
      params: {
        returnDirections: false,
        returnRoutes: true,
        outputLines: "esriNAOutputLineTrueShape",
        impedanceAttributeName: mode === "walk-time" ? "WalkTime" : "TravelTime"
      },
      ...authOptions
    });

    const route = response.routes?.features?.[0]?.attributes;
    return {
      mode,
      estimatedMinutes: route?.Total_TravelTime ?? null,
      estimatedMiles: route?.Total_Miles ?? null
    };
  },

  async enrichNeedSnapshot(points) {
    if (!env.arcgisApiKey || !Array.isArray(points) || points.length === 0) {
      return [];
    }

    const studyAreas = points.map((point) => ({
      geometry: {
        x: point.lon,
        y: point.lat
      }
    }));

    const response = await request("https://geoenrich.arcgis.com/arcgis/rest/services/World/geoenrichmentserver/Geoenrichment/enrich", {
      httpMethod: "POST",
      params: {
        f: "json",
        studyAreas: JSON.stringify(studyAreas),
        analysisVariables: "KeyGlobalFacts.TOTPOP,KeyGlobalFacts.AVGHHSZ"
      },
      ...authOptions
    });

    return response?.results || [];
  }
};
