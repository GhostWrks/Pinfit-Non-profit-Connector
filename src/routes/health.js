import { Router } from "express";

export const healthRouter = Router();

healthRouter.get("/", (req, res) => {
  res.json({
    status: "ok",
    service: "nonprofitfinder-backend",
    timestamp: new Date().toISOString()
  });
});
