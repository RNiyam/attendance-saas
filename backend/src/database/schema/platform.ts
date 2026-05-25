import { integer, pgTable, uniqueIndex, varchar } from "drizzle-orm/pg-core";
import { platformAdminStatusEnum } from "./pg-enums";
import { createdAtCol, tableId, updatedAtCol } from "../pg-columns";

export const platformAdmins = pgTable(
  "platform_admins",
  {
    id: tableId(),
    email: varchar("email", { length: 255 }).notNull(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    displayName: varchar("display_name", { length: 150 }).notNull(),
    status: platformAdminStatusEnum("status").notNull().default("active"),
    createdAt: createdAtCol(),
    updatedAt: updatedAtCol(),
  },
  (t) => [uniqueIndex("platform_admins_email_uidx").on(t.email)],
);

export const refStates = pgTable(
  "ref_states",
  {
    id: tableId(),
    code: varchar("code", { length: 8 }).notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: integer("is_active").notNull().default(1),
  },
  (t) => [uniqueIndex("ref_states_code_uidx").on(t.code)],
);

export const refCities = pgTable(
  "ref_cities",
  {
    id: tableId(),
    stateId: integer("state_id").notNull(),
    name: varchar("name", { length: 150 }).notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: integer("is_active").notNull().default(1),
  },
  (t) => [uniqueIndex("ref_cities_state_name_uidx").on(t.stateId, t.name)],
);

export const refSectors = pgTable(
  "ref_sectors",
  {
    id: tableId(),
    code: varchar("code", { length: 80 }).notNull(),
    name: varchar("name", { length: 128 }).notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: integer("is_active").notNull().default(1),
  },
  (t) => [uniqueIndex("ref_sectors_code_uidx").on(t.code)],
);

export const refSubSectors = pgTable(
  "ref_sub_sectors",
  {
    id: tableId(),
    sectorId: integer("sector_id").notNull(),
    code: varchar("code", { length: 80 }).notNull(),
    name: varchar("name", { length: 128 }).notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: integer("is_active").notNull().default(1),
  },
  (t) => [uniqueIndex("ref_sub_sectors_sector_code_uidx").on(t.sectorId, t.code)],
);

/** Configurable platform enums (employee bands, payable days, org roles, etc.). */
export const platformEnumMasters = pgTable(
  "platform_enum_masters",
  {
    id: tableId(),
    enumType: varchar("enum_type", { length: 64 }).notNull(),
    code: varchar("code", { length: 64 }).notNull(),
    label: varchar("label", { length: 150 }).notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: integer("is_active").notNull().default(1),
  },
  (t) => [uniqueIndex("platform_enum_type_code_uidx").on(t.enumType, t.code)],
);
