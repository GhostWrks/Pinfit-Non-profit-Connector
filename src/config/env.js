import dotenv from "dotenv";

dotenv.config();

const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const env = {
  port: toNumber(process.env.PORT, 4000),
  nodeEnv: process.env.NODE_ENV || "development",
  jwtSecret: process.env.JWT_SECRET || "dev-secret-change-me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "8h",
  arcgisApiKey: process.env.ARCGIS_API_KEY || "",
  arcgisPortalUrl: process.env.ARCGIS_PORTAL_URL || "https://www.arcgis.com",
  defaultSearchRadiusMiles: toNumber(process.env.DEFAULT_SEARCH_RADIUS_MILES, 10)
};
