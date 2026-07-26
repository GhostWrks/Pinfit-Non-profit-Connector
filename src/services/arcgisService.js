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
    const singleLine = String(address || "").trim();
    if (!singleLine) {
      return null;
    }

    if (!env.arcgisApiKey) {
      // Fallback geocoder for local/dev when ArcGIS API key is not configured.
      const nominatimUrl = new URL("https://nominatim.openstreetmap.org/search");
      nominatimUrl.searchParams.set("q", singleLine);
      nominatimUrl.searchParams.set("format", "jsonv2");
      nominatimUrl.searchParams.set("limit", "1");

      const fallbackResponse = await fetch(nominatimUrl.toString(), {
        headers: {
          Accept: "application/json",
          "User-Agent": "PinHelp-Nonprofit-Connector/1.0"
        }
      });

      if (!fallbackResponse.ok) {
        return null;
      }

      const fallbackPayload = await fallbackResponse.json();
      const hit = Array.isArray(fallbackPayload) ? fallbackPayload[0] : null;
      if (!hit) {
        return null;
      }

      const lat = Number(hit.lat);
      const lon = Number(hit.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
        return null;
      }

      return {
        lat,
        lon,
        score: null
      };
    }

    const response = await geocode({
      params: { singleLine, outFields: "*" },
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

  // ── Hotspot Analysis (FindHotSpots) ────────────────────────────────────────

  /**
   * Gets a user token via generateToken (username/password).
   * Caches the token until it expires.
   */
  _userTokenCache: { token: null, expiresAt: 0 },

  async getAnalysisToken() {
    // Return cached token if still valid (with 60s buffer)
    if (this._userTokenCache.token && Date.now() < this._userTokenCache.expiresAt - 60000) {
      return this._userTokenCache.token;
    }

    if (!env.arcgisUsername || !env.arcgisPassword) {
      throw new Error("ARCGIS_USERNAME and ARCGIS_PASSWORD are required for spatial analysis");
    }

    const portalUrl = env.arcgisPortalUrl.replace(/\/+$/, "");
    const res = await fetch(`${portalUrl}/sharing/rest/generateToken`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        username: env.arcgisUsername,
        password: env.arcgisPassword,
        referer: "https://www.arcgis.com",
        f: "json",
      }).toString(),
    });

    const data = await res.json();
    if (!data.token) {
      throw new Error(`generateToken failed: ${JSON.stringify(data)}`);
    }

    this._userTokenCache = {
      token: data.token,
      expiresAt: data.expires || (Date.now() + 7200000), // default 2h
    };

    return data.token;
  },

  /**
   * Discovers the spatial analysis service URL for the authenticated org.
   */
  async getAnalysisServiceUrl() {
    const token = await this.getAnalysisToken();

    const portalUrl = env.arcgisPortalUrl.replace(/\/+$/, "");
    const selfUrl = `${portalUrl}/sharing/rest/portals/self?f=json&token=${encodeURIComponent(token)}`;
    const res = await fetch(selfUrl);
    const data = await res.json();

    const analysisUrl = data?.helperServices?.analysis?.url;
    if (!analysisUrl) {
      throw new Error("Could not resolve spatial analysis service URL from portal");
    }
    return analysisUrl;
  },

  /**
   * Run FindHotSpots on the SVI demographic feature layer for a given county.
   * Combines multiple analysis fields by averaging the Gi* z-scores across fields.
   *
   * @param {object} opts
   * @param {string} opts.county - County name (e.g. "San Bernardino")
   * @param {string} opts.stAbbr - State abbreviation (e.g. "CA")
   * @param {string[]} opts.analysisFields - Demographic field names (e.g. ["E_POV150","E_UNEMP"])
   * @returns {object} Combined hotspot result with feature collection
   */
  async runHotspotAnalysis({ county, stAbbr, analysisFields }) {
    if (!county || !stAbbr || !analysisFields?.length) {
      throw new Error("county, stAbbr, and at least one analysisField are required");
    }

    const token = await this.getAnalysisToken();

    const SVI_LAYER_URL =
      "https://services8.arcgis.com/LLNIdHmmdjO2qQ5q/arcgis/rest/services/Vulnerable_Population_Estimates/FeatureServer/0";

    const analysisUrl = await this.getAnalysisServiceUrl();
    const submitUrl = `${analysisUrl}/FindHotSpots/submitJob`;

    const countyEsc = county.replace(/'/g, "''");
    const stEsc = stAbbr.replace(/'/g, "''");
    const filter = `COUNTY='${countyEsc}' AND ST_ABBR='${stEsc}'`;

    // Run one FindHotSpots job per field
    const fieldResults = [];

    for (const field of analysisFields) {
      const params = new URLSearchParams({
        analysisLayer: JSON.stringify({
          url: SVI_LAYER_URL,
          filter
        }),
        analysisField: field,
        f: "json",
        token
      });

      // Submit the job
      const submitRes = await fetch(submitUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString()
      });
      const jobInfo = await submitRes.json();

      if (!jobInfo.jobId) {
        throw new Error(
          `FindHotSpots submission failed for field ${field}: ${JSON.stringify(jobInfo)}`
        );
      }

      // Poll for completion (max ~5 min)
      const jobBaseUrl = `${analysisUrl}/FindHotSpots/jobs/${jobInfo.jobId}`;
      let status = jobInfo.jobStatus;
      const maxPolls = 100; // 100 * 3s = 5 minutes
      let polls = 0;

      while (status !== "esriJobSucceeded" && polls < maxPolls) {
        await new Promise((r) => setTimeout(r, 3000));
        const pollRes = await fetch(`${jobBaseUrl}?f=json&token=${encodeURIComponent(token)}`);
        const pollData = await pollRes.json();
        status = pollData.jobStatus;
        polls++;

        if (status === "esriJobFailed" || status === "esriJobCancelled" || status === "esriJobTimedOut") {
          throw new Error(`FindHotSpots job ${status} for field ${field}: ${JSON.stringify(pollData)}`);
        }
      }

      if (status !== "esriJobSucceeded") {
        throw new Error(`FindHotSpots job timed out for field ${field}`);
      }

      // Fetch result feature collection
      const resultUrl = `${jobBaseUrl}/results/hotSpotsResultLayer?f=json&token=${encodeURIComponent(token)}`;
      const resultRes = await fetch(resultUrl);
      const resultData = await resultRes.json();

      fieldResults.push({
        field,
        featureCollection: resultData.value
      });
    }

    // If only one field, return it directly
    if (fieldResults.length === 1) {
      return {
        county,
        stAbbr,
        analysisFields,
        combined: false,
        result: fieldResults[0].featureCollection
      };
    }

    // Combine multiple fields: average Gi* z-scores across runs
    // Use the first result as the base geometry and merge z-scores
    const base = fieldResults[0].featureCollection;
    const baseFeatures = base.featureSet?.features || [];
    const combinedFeatures = baseFeatures.map((feature, idx) => {
      let sumZ = 0;
      let count = 0;

      for (const fr of fieldResults) {
        const matchFeature = fr.featureCollection?.featureSet?.features?.[idx];
        if (matchFeature) {
          // The Gi* z-score field is typically named "GiZScore" or "Gi_Bin"
          const zScore =
            matchFeature.attributes?.GiZScore ??
            matchFeature.attributes?.Gi_ZScore ??
            matchFeature.attributes?.["Hot_Spot_Analysis_GiZScore"] ??
            0;
          sumZ += Number(zScore) || 0;
          count++;
        }
      }

      const avgZ = count > 0 ? sumZ / count : 0;
      // Derive confidence bin from averaged z-score
      let confidenceBin = 0;
      if (avgZ >= 2.58) confidenceBin = 3;       // 99% hot
      else if (avgZ >= 1.96) confidenceBin = 2;  // 95% hot
      else if (avgZ >= 1.65) confidenceBin = 1;  // 90% hot
      else if (avgZ <= -2.58) confidenceBin = -3; // 99% cold
      else if (avgZ <= -1.96) confidenceBin = -2; // 95% cold
      else if (avgZ <= -1.65) confidenceBin = -1; // 90% cold

      return {
        geometry: feature.geometry,
        attributes: {
          ...feature.attributes,
          Combined_GiZScore: Math.round(avgZ * 1000) / 1000,
          Confidence_Bin: confidenceBin
        }
      };
    });

    // Build combined layer definition
    const combinedLayerDef = {
      ...(base.layerDefinition || {}),
      fields: [
        ...(base.layerDefinition?.fields || []),
        { name: "Combined_GiZScore", type: "esriFieldTypeDouble", alias: "Combined Gi* Z-Score" },
        { name: "Confidence_Bin", type: "esriFieldTypeInteger", alias: "Confidence Bin (-3 to +3)" }
      ]
    };

    return {
      county,
      stAbbr,
      analysisFields,
      combined: true,
      result: {
        layerDefinition: combinedLayerDef,
        featureSet: {
          ...base.featureSet,
          features: combinedFeatures
        }
      }
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
