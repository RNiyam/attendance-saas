import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  const requestId = (_req as Request & { requestId?: string }).requestId;
  console.error("[error]", { requestId, err });
  if (res.headersSent) return;
  if (err instanceof ZodError) {
    res.status(400).json({ error: "Validation failed", code: "VALIDATION_ERROR", requestId, details: err.flatten() });
    return;
  }
  const message = err instanceof Error ? err.message : "Internal Server Error";
  const status = typeof (err as { status?: number }).status === "number" ? (err as { status: number }).status : 500;
  res.status(status).json({ error: message, code: "REQUEST_FAILED", requestId });
}
