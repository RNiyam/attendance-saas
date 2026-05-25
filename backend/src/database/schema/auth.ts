import { integer, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { createdAtCol, tableId } from "../pg-columns";
import { users } from "./users";

/** Refresh-token sessions (one row per device/session). */
export const authSessions = pgTable("auth_sessions", {
  id: tableId(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  refreshTokenHash: varchar("refresh_token_hash", { length: 255 }).notNull(),
  deviceInfo: text("device_info"),
  ipAddress: varchar("ip_address", { length: 64 }),
  expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
  createdAt: createdAtCol(),
});

/** OTP audit / fallback; hot path can still use Redis. */
export const otpVerifications = pgTable("otp_verifications", {
  id: tableId(),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  phone: varchar("phone", { length: 32 }).notNull(),
  otpCode: varchar("otp_code", { length: 12 }).notNull(),
  expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
  verifiedAt: timestamp("verified_at", { mode: "date" }),
  createdAt: createdAtCol(),
});
