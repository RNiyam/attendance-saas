import {
  boolean,
  int,
  mysqlEnum,
  mysqlTable,
  timestamp,
  varchar,
  uniqueIndex,
} from "drizzle-orm/mysql-core";
import { organizations } from "./organizations";

/**
 * IAM identity (login). Not the same as HR employee profile (comes later).
 */
export const users = mysqlTable(
  "users",
  {
    id: int("id").autoincrement().primaryKey(),
    organizationId: int("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
  uuid: varchar("uuid", { length: 36 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull(),
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  phone: varchar("phone", { length: 32 }),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  passwordChangeRequired: boolean("password_change_required").notNull().default(false),
  temporaryPasswordExpiresAt: timestamp("temporary_password_expires_at"),
  authProvider: varchar("auth_provider", { length: 32 }).notNull().default("local"),
  isEmailVerified: boolean("is_email_verified").notNull().default(false),
  isPhoneVerified: boolean("is_phone_verified").notNull().default(false),
  lastLoginAt: timestamp("last_login_at"),
  failedLoginAttempts: int("failed_login_attempts").notNull().default(0),
  accountLockedUntil: timestamp("account_locked_until"),
  status: mysqlEnum("status", ["active", "invited", "disabled"]).notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (t) => [uniqueIndex("users_org_email_uidx").on(t.organizationId, t.email)],
);
