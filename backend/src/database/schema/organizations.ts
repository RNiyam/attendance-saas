import { pgTable, integer, varchar } from "drizzle-orm/pg-core";
import { orgStatusEnum } from "./pg-enums";
import { tableId, createdAtCol, updatedAtCol } from "../pg-columns";

/**
 * SaaS tenant: one row per company on the platform.
 * All business data scopes under organization_id.
 */
export const organizations = pgTable("organizations", {
  id: tableId(),
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
  standardWorkdayMinutes: integer("standard_workday_minutes").notNull().default(480),
  status: orgStatusEnum("status").notNull().default("active"),
  subscriptionStatus: varchar("subscription_status", { length: 64 }).notNull().default("trial"),
  createdAt: createdAtCol(),
  updatedAt: updatedAtCol(),
});
