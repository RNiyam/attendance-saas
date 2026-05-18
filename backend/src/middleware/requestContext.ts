import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

export type ContextRequest = Request & { requestId?: string };

export function requestContext(req: ContextRequest, res: Response, next: NextFunction): void {
  const incoming = req.header("x-request-id");
  const requestId = incoming && incoming.length > 0 ? incoming : randomUUID();
  req.requestId = requestId;
  res.setHeader("x-request-id", requestId);
  next();
}
