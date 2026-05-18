import {
  int,
  mysqlEnum,
  mysqlTable,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

/**
 * SaaS tenant: one row per company on the platform.
 * All business data scopes under organization_id.
 */
export const organizations = mysqlTable("organizations", {
  id: int("id").autoincrement().primaryKey(),
  uuid: varchar("uuid", { length: 36 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  legalName: varchar("legal_name", { length: 255 }),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  website: varchar("website", { length: 512 }),
  logoUrl: varchar("logo_url", { length: 1024 }),
  timezone: varchar("timezone", { length: 64 }).notNull().default("UTC"),
  currency: varchar("currency", { length: 8 }).notNull().default("USD"),
  country: varchar("country", { length: 2 }),
  regionState: varchar("region_state", { length: 100 }),
  regionCity: varchar("region_city", { length: 150 }),
  businessSector: varchar("business_sector", { length: 128 }),
  businessSubSector: varchar("business_sub_sector", { length: 128 }),
  employeeCountBand: varchar("employee_count_band", { length: 32 }),
  alternateContactName: varchar("alternate_contact_name", { length: 150 }),
  payableDaysPolicy: varchar("payable_days_policy", { length: 32 }).notNull().default("calendar_month"),
  standardWorkdayMinutes: int("standard_workday_minutes").notNull().default(480),
  status: mysqlEnum("status", ["active", "suspended"]).notNull().default("active"),
  subscriptionStatus: varchar("subscription_status", { length: 64 }).notNull().default("trial"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
