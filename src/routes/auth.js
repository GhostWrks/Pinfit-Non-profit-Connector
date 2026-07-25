import { Router } from "express";

import { authService } from "../services/authService.js";
import { nonprofitLoginSchema } from "../utils/validation.js";

export const authRouter = Router();

authRouter.post("/nonprofit/login", (req, res) => {
  const result = nonprofitLoginSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      error: "Validation Error",
      message: result.error.issues[0]?.message || "Invalid login payload"
    });
  }

  const session = authService.loginNonprofit(result.data.email, result.data.password);

  if (!session) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Invalid email or password"
    });
  }

  return res.json(session);
});
