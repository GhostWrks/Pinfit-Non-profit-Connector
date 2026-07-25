import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { env } from "./config/env.js";

import { healthRouter } from "./routes/health.js";
import { donorRouter } from "./routes/donor.js";
import { authRouter } from "./routes/auth.js";
import { nonprofitRouter } from "./routes/nonprofit.js";
import { analyticsRouter } from "./routes/analytics.js";
import { notFoundHandler, errorHandler } from "./middleware/errorHandlers.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicPath = path.join(__dirname, "../public");
const frontendDistPath = path.join(__dirname, "../frontend/dist");
const webRootPath = fs.existsSync(frontendDistPath) ? frontendDistPath : publicPath;

export const createApp = () => {
  const app = express();

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          frameAncestors: ["'self'"],
          objectSrc: ["'none'"],
          scriptSrc: ["'self'", "https://js.arcgis.com"],
          scriptSrcAttr: ["'none'"],
          styleSrc: [
            "'self'",
            "'unsafe-inline'",
            "https://js.arcgis.com",
            "https://fonts.googleapis.com"
          ],
          imgSrc: ["'self'", "data:", "blob:", "https:"],
          fontSrc: ["'self'", "https:", "data:", "https://fonts.gstatic.com"],
          connectSrc: [
            "'self'",
            "https://*.arcgis.com",
            "https://*.arcgisonline.com",
            "https://services.arcgisonline.com",
            "https://basemaps.arcgis.com",
            "https://static.arcgis.com"
          ],
          workerSrc: ["'self'", "blob:", "https://js.arcgis.com"],
          childSrc: ["'self'", "blob:"],
          frameSrc: ["'self'", "https://*.arcgis.com"],
          upgradeInsecureRequests: []
        }
      }
    })
  );
  app.use(cors());
  app.use(express.json({ limit: "1mb" }));
  app.use(morgan("dev"));

  app.get("/app-config.js", (req, res) => {
    const payload = {
      arcgisApiKey: env.arcgisApiKey || ""
    };

    res.setHeader("Cache-Control", "no-store");
    res.type("application/javascript");
    res.send(`window.__APP_CONFIG = ${JSON.stringify(payload)};`);
  });

  app.use(express.static(webRootPath));

  app.use("/api/health", healthRouter);
  app.use("/api/donor", donorRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/nonprofit", nonprofitRouter);
  app.use("/api/analytics", analyticsRouter);

  app.get("/", (req, res) => {
    res.sendFile(path.join(webRootPath, "index.html"));
  });

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
