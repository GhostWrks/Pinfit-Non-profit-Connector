import { authService } from "../services/authService.js";

export const requireNonprofitAuth = (req, res, next) => {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Missing or invalid bearer token"
    });
  }

  try {
    const payload = authService.verifyToken(token);

    if (payload.role !== "nonprofit") {
      return res.status(403).json({
        error: "Forbidden",
        message: "Nonprofit role is required"
      });
    }

    req.auth = payload;
    return next();
  } catch {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Token has expired or is invalid"
    });
  }
};
