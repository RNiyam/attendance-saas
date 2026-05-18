import type { NextFunction, Request, Response } from "express";
import { getRedis } from "../config/redis";

type RateLimitOptions = {
  keyPrefix: string;
  windowSeconds: number;
  max: number;
};

export function rateLimit(options: RateLimitOptions) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const redis = getRedis();
    if (!redis || !redis.isOpen) {
      next();
      return;
    }
    const ip = req.ip || "unknown";
    const key = `${options.keyPrefix}:${ip}`;
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, options.windowSeconds);
    }
    if (count > options.max) {
      res.status(429).json({ error: "Too many requests. Please try again later." });
      return;
    }
    next();
  };
}
