import { Router } from "express";
import { z } from "zod";

import { volunteerShiftCsvStore } from "../services/volunteerShiftCsvStore.js";

export const volunteerShiftsRouter = Router();

const shiftSchema = z.object({
  organizationName: z.string().trim().min(2),
  roleTitle: z.string().trim().min(2),
  shiftDate: z.string().trim().min(4),
  startTime: z.string().trim().min(3),
  endTime: z.string().trim().min(3),
  volunteersNeeded: z.number().int().min(1).max(500),
  location: z.string().trim().min(2),
  notes: z.string().trim().optional().default(""),
  contactName: z.string().trim().optional().default(""),
  contactEmail: z.string().trim().optional().default("")
});

volunteerShiftsRouter.get("/", (req, res) => {
  const shifts = volunteerShiftCsvStore.readAll();
  return res.json({ shifts });
});

volunteerShiftsRouter.post("/", (req, res) => {
  const parsed = shiftSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Validation Error",
      message: parsed.error.issues[0]?.message || "Invalid shift payload"
    });
  }

  const shift = volunteerShiftCsvStore.create(parsed.data);
  return res.status(201).json({
    message: "Volunteer shift created",
    shift
  });
});
