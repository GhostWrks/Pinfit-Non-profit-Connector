import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { haversineDistanceMiles } from "../utils/geo.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const seedFilePath = path.join(__dirname, "../../data/nonprofits.seed.json");

const seedRecords = JSON.parse(fs.readFileSync(seedFilePath, "utf8"));
const nonprofits = structuredClone(seedRecords);

const clone = (value) => JSON.parse(JSON.stringify(value));

const includesValue = (list, value) =>
  Array.isArray(list) && list.some((entry) => String(entry).toLowerCase() === String(value).toLowerCase());

export const dataStore = {
  getAll() {
    return clone(nonprofits);
  },

  getById(id) {
    const item = nonprofits.find((n) => n.id === id);
    return item ? clone(item) : null;
  },

  queryNearby({
    center,
    zip,
    textQuery,
    distanceMiles,
    needTypes,
    organizationTypes,
    volunteersNeeded,
    category
  }) {
    const normalizedTextQuery = String(textQuery || "").trim().toLowerCase();

    return nonprofits
      .map((org) => ({
        ...org,
        distanceMiles: center ? haversineDistanceMiles(center, org.location) : null
      }))
      .filter((org) => {
        if (normalizedTextQuery) {
          const searchable = [
            org.name,
            org.address,
            org.zip,
            org.category,
            org.organizationType,
            org.notes,
            org.mainContact,
            ...(Array.isArray(org.needs) ? org.needs : [])
          ]
            .join(" ")
            .toLowerCase();

          if (!searchable.includes(normalizedTextQuery)) {
            return false;
          }
        }

        if (zip && org.zip !== zip) {
          return false;
        }

        if (distanceMiles != null && org.distanceMiles != null && org.distanceMiles > distanceMiles) {
          return false;
        }

        if (category && String(org.category).toLowerCase() !== String(category).toLowerCase()) {
          return false;
        }

        if (Array.isArray(organizationTypes) && organizationTypes.length > 0) {
          const matchesOrgType = organizationTypes.some(
            (type) => String(type).toLowerCase() === String(org.organizationType).toLowerCase()
          );
          if (!matchesOrgType) {
            return false;
          }
        }

        if (Array.isArray(needTypes) && needTypes.length > 0) {
          const hasNeed = needTypes.some((need) => includesValue(org.needs, need));
          if (!hasNeed) {
            return false;
          }
        }

        if (typeof volunteersNeeded === "boolean" && org.volunteersNeeded !== volunteersNeeded) {
          return false;
        }

        return true;
      })
      .sort((a, b) => (a.distanceMiles ?? Number.MAX_SAFE_INTEGER) - (b.distanceMiles ?? Number.MAX_SAFE_INTEGER))
      .map(clone);
  },

  updateNeeds(id, payload) {
    const orgIndex = nonprofits.findIndex((n) => n.id === id);
    if (orgIndex < 0) {
      return null;
    }

    const current = nonprofits[orgIndex];
    const next = {
      ...current,
      needs: payload.needs,
      volunteersNeeded: payload.volunteersNeeded,
      priority: payload.priority,
      urgencyScore: payload.urgencyScore,
      lastUpdated: new Date().toISOString()
    };

    nonprofits[orgIndex] = next;
    return clone(next);
  },

  updateProfile(id, payload) {
    const orgIndex = nonprofits.findIndex((n) => n.id === id);
    if (orgIndex < 0) {
      return null;
    }

    nonprofits[orgIndex] = {
      ...nonprofits[orgIndex],
      ...payload,
      lastUpdated: new Date().toISOString()
    };

    return clone(nonprofits[orgIndex]);
  }
};
