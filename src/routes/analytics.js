import { Router } from "express";

import { requireNonprofitAuth } from "../middleware/auth.js";
import { dataStore } from "../services/dataStore.js";

export const analyticsRouter = Router();

const aggregateNeeds = (rows) => {
  const counts = new Map();

  rows.forEach((row) => {
    row.needs.forEach((need) => {
      const key = String(need).toLowerCase();
      counts.set(key, (counts.get(key) || 0) + 1);
    });
  });

  return [...counts.entries()]
    .map(([need, count]) => ({ need, count }))
    .sort((a, b) => b.count - a.count);
};

const aggregateOrganizationTypes = (rows) => {
  const counts = new Map();

  rows.forEach((row) => {
    const key = String(row.organizationType || "unknown").toLowerCase();
    counts.set(key, (counts.get(key) || 0) + 1);
  });

  return [...counts.entries()]
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);
};

analyticsRouter.get("/public", (req, res) => {
  const rows = dataStore.getAll();
  const needsByCategory = aggregateNeeds(rows);
  const organizationTypes = aggregateOrganizationTypes(rows);

  const urgentNeedsThisWeek = rows
    .filter((row) => row.priority === "high")
    .sort((a, b) => b.urgencyScore - a.urgencyScore)
    .slice(0, 5)
    .map((row) => ({
      id: row.id,
      nonprofit: row.name,
      needs: row.needs,
      urgencyScore: row.urgencyScore,
      lastUpdated: row.lastUpdated
    }));

  const areaRanking = rows
    .map((row) => ({ zip: row.zip, unmetNeedScore: row.urgencyScore }))
    .sort((a, b) => b.unmetNeedScore - a.unmetNeedScore);

  return res.json({
    indicators: {
      nonprofitCount: rows.length,
      volunteerNeededCount: rows.filter((row) => row.volunteersNeeded).length,
      topNeedType: needsByCategory[0]?.need || null
    },
    charts: {
      needsByCategory,
      organizationTypes
    },
    urgentNeedsThisWeek,
    areaRanking
  });
});

analyticsRouter.get("/nonprofit/insights", requireNonprofitAuth, (req, res) => {
  const org = dataStore.getById(req.auth.orgId);
  if (!org) {
    return res.status(404).json({
      error: "Not Found",
      message: "Organization not found"
    });
  }

  const nearby = dataStore.queryNearby({
    center: org.location,
    distanceMiles: 25
  });

  const donorInterestByCategory = aggregateNeeds(nearby).slice(0, 6);
  const suggestedOutreachZones = nearby
    .filter((item) => item.urgencyScore >= 70 && item.distanceMiles >= 5)
    .slice(0, 5)
    .map((item) => ({
      target: item.zip,
      nonprofit: item.name,
      urgencyScore: item.urgencyScore,
      distanceMiles: item.distanceMiles
    }));

  return res.json({
    organization: {
      id: org.id,
      name: org.name,
      peopleReached: org.peopleReached,
      volunteersNeeded: org.volunteersNeeded
    },
    needTrendsByArea: nearby.map((item) => ({
      zip: item.zip,
      urgencyScore: item.urgencyScore,
      needsCount: item.needs.length
    })),
    donorInterestByCategory,
    suggestedOutreachZones
  });
});
