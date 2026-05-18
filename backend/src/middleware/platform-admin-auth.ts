import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { getEnv } from "../config/env";

export type PlatformAdminRequest = Request & {
  platformAdmin?: { id: number; email: string };
};

export function platformAdminAuth(req: PlatformAdminRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing bearer token" });
    return;
  }
  const token = header.slice("Bearer ".length);
  try {
    const env = getEnv();
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as unknown as {
      sub: number;
      email: string;
      typ?: string;
    };
    if (payload.typ !== "platform_access") {
      res.status(401).json({ error: "Invalid token type" });
      return;
    }
    req.platformAdmin = { id: payload.sub, email: payload.email };
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired access token" });
  }
}
