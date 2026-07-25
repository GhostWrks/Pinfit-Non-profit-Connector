import jwt from "jsonwebtoken";

import { env } from "../config/env.js";
import { dataStore } from "./dataStore.js";

// Demo-only nonprofit accounts mapped to seed data ids.
const nonprofitUsers = [
  {
    userId: "user-001",
    organizationId: "np-001",
    email: "hello@riverbendpantry.org",
    password: "np-demo-123"
  },
  {
    userId: "user-002",
    organizationId: "np-002",
    email: "contact@horizonyouth.org",
    password: "np-demo-123"
  }
];

export const authService = {
  loginNonprofit(email, password) {
    const user = nonprofitUsers.find(
      (item) => item.email.toLowerCase() === String(email).toLowerCase()
    );

    if (!user || user.password !== password) {
      return null;
    }

    const organization = dataStore.getById(user.organizationId);
    if (!organization) {
      return null;
    }

    const token = jwt.sign(
      {
        sub: user.userId,
        orgId: user.organizationId,
        role: "nonprofit"
      },
      env.jwtSecret,
      { expiresIn: env.jwtExpiresIn }
    );

    return {
      token,
      user: {
        userId: user.userId,
        email: user.email,
        role: "nonprofit"
      },
      organization
    };
  },

  verifyToken(token) {
    return jwt.verify(token, env.jwtSecret);
  }
};
