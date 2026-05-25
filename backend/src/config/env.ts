import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(5000),
  APP_URL: z.string().default("http://localhost:3000"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_ACCESS_SECRET: z.string().min(32, "JWT_ACCESS_SECRET must be at least 32 characters"),
  JWT_REFRESH_SECRET: z.string().min(32, "JWT_REFRESH_SECRET must be at least 32 characters"),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
  REDIS_URL: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
  /** AES-256-GCM key material for org SMTP passwords (min 16 chars recommended). */
  SMTP_SECRETS_ENCRYPTION_KEY: z.string().optional(),
  /** Protects /api/super-admin/* when set. */
  SUPER_ADMIN_API_KEY: z.string().optional(),
  /** Creates the first platform admin on boot if none exists. */
  PLATFORM_ADMIN_EMAIL: z.string().email().optional(),
  PLATFORM_ADMIN_PASSWORD: z.string().min(8).optional(),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

/**
 * Validates process.env once. Call from server.ts so the app fails fast
 * instead of crashing mid-request with undefined config.
 */
export function loadEnv(): Env {
  if (cached) return cached;
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const msg = parsed.error.flatten().fieldErrors;
    console.error("[env] Invalid environment variables:", msg);
    throw new Error("Invalid environment variables");
  }
  cached = parsed.data;
  return cached;
}

export function getEnv(): Env {
  if (!cached) throw new Error("loadEnv() must be called before getEnv()");
  return cached;
}
