import { Router } from "express";
import { z } from "zod";

import { broadcastCsvStore } from "../services/broadcastCsvStore.js";

export const broadcastsRouter = Router();

const createBroadcastSchema = z.object({
  senderOrganization: z.string().trim().min(2),
  recipients: z.array(z.string().trim().min(2)).min(1),
  title: z.string().trim().min(2),
  category: z.string().trim().min(2).default("General"),
  urgency: z.enum(["Low", "Normal", "High", "Critical"]).default("Normal"),
  location: z.string().trim().optional().default(""),
  startDate: z.string().trim().optional().default(""),
  endDate: z.string().trim().optional().default(""),
  message: z.string().trim().min(4),
  contactName: z.string().trim().optional().default(""),
  contactEmail: z.string().trim().optional().default("")
});

const updateResponseSchema = z.object({
  organizationName: z.string().trim().min(2),
  responseStatus: z.enum(["can-help", "cannot-help", "need-details"]),
  responseNote: z.string().trim().optional().default("")
});

broadcastsRouter.get("/", (req, res) => {
  const organization = String(req.query.organization || "").trim();
  const mode = String(req.query.mode || "inbox").trim().toLowerCase();

  if (!organization) {
    return res.status(400).json({
      error: "Validation Error",
      message: "organization query parameter is required"
    });
  }

  if (mode === "sent") {
    const broadcasts = broadcastCsvStore.summarizeSent(organization);
    return res.json({ broadcasts });
  }

  const broadcasts = broadcastCsvStore.listInbox(organization);
  return res.json({ broadcasts });
});

broadcastsRouter.post("/", (req, res) => {
  const parsed = createBroadcastSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Validation Error",
      message: parsed.error.issues[0]?.message || "Invalid broadcast payload"
    });
  }

  const created = broadcastCsvStore.createBroadcast(parsed.data);
  return res.status(201).json({
    message: "Broadcast sent",
    broadcastId: created.broadcastId,
    createdCount: created.createdCount,
    entries: created.rows
  });
});

broadcastsRouter.patch("/:id/response", (req, res) => {
  const parsed = updateResponseSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Validation Error",
      message: parsed.error.issues[0]?.message || "Invalid response payload"
    });
  }

  const updated = broadcastCsvStore.updateResponse(
    req.params.id,
    parsed.data.organizationName,
    parsed.data.responseStatus,
    parsed.data.responseNote
  );

  if (!updated) {
    return res.status(404).json({
      error: "Not Found",
      message: "Broadcast entry not found for this organization"
    });
  }

  return res.json({
    message: "Response saved",
    broadcast: updated
  });
});
