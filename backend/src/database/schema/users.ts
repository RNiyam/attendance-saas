import {
  boolean,
  integer,
  pgTable,
  timestamp,
  varchar,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { userStatusEnum } from "./pg-enums";
import { tableId, createdAtCol, updatedAtCol } from "../pg-columns";
import { organizations } from "./organizations";

/**
 * IAM identity (login). Not the same as HR employee profile (comes later).
 */
export const users = pgTable(
  "users",
  {
    id: tableId(),
    organizationId: integer("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    uuid: varchar("uuid", { length: 36 }).notNull().unique(),
    email: varchar("email", { length: 255 }).notNull(),
    firstName: varchar("first_name", { length: 100 }),
    lastName: varchar("last_name", { length: 100 }),
    phone: varchar("phone", { length: 32 }),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    passwordChangeRequired: boolean("password_change_required").notNull().default(false),
    temporaryPasswordExpiresAt: timestamp("temporary_password_expires_at", { mode: "date" }),
    authProvider: varchar("auth_provider", { length: 32 }).notNull().default("local"),
    isEmailVerified: boolean("is_email_verified").notNull().default(false),
    isPhoneVerified: boolean("is_phone_verified").notNull().default(false),
    lastLoginAt: timestamp("last_login_at", { mode: "date" }),
    failedLoginAttempts: integer("failed_login_attempts").notNull().default(0),
    accountLockedUntil: timestamp("account_locked_until", { mode: "date" }),
    status: userStatusEnum("status").notNull().default("active"),
    createdAt: createdAtCol(),
    updatedAt: updatedAtCol(),
  },
  (t) => [uniqueIndex("users_org_email_uidx").on(t.organizationId, t.email)],
);
