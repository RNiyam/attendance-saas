import type { NextFunction, Request, Response } from "express";
import { getEnv } from "../config/env";

/**
 * Secures platform-level routes. Set SUPER_ADMIN_API_KEY in the server environment
 * and send header `X-Super-Admin-Key` with the same value.
 */
export function superAdminAuth(req: Request, res: Response, next: NextFunction): void {
  const expected = getEnv().SUPER_ADMIN_API_KEY;
  if (!expected) {
    res.status(503).json({ error: "SUPER_ADMIN_API_KEY is not configured on this server." });
    return;
  }
  const key = req.header("x-super-admin-key");
  if (!key || key !== expected) {
    res.status(401).json({ error: "Invalid or missing X-Super-Admin-Key header." });
    return;
  }
  next();
}
