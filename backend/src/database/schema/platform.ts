import { int, mysqlEnum, mysqlTable, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

export const platformAdmins = mysqlTable(
  "platform_admins",
  {
    id: int("id").autoincrement().primaryKey(),
    email: varchar("email", { length: 255 }).notNull(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    displayName: varchar("display_name", { length: 150 }).notNull(),
    status: mysqlEnum("status", ["active", "inactive"]).notNull().default("active"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (t) => [uniqueIndex("platform_admins_email_uidx").on(t.email)],
);

export const refStates = mysqlTable(
  "ref_states",
  {
    id: int("id").autoincrement().primaryKey(),
    code: varchar("code", { length: 8 }).notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    sortOrder: int("sort_order").notNull().default(0),
    isActive: int("is_active").notNull().default(1),
  },
  (t) => [uniqueIndex("ref_states_code_uidx").on(t.code)],
);

export const refCities = mysqlTable(
  "ref_cities",
  {
    id: int("id").autoincrement().primaryKey(),
    stateId: int("state_id").notNull(),
    name: varchar("name", { length: 150 }).notNull(),
    sortOrder: int("sort_order").notNull().default(0),
    isActive: int("is_active").notNull().default(1),
  },
  (t) => [uniqueIndex("ref_cities_state_name_uidx").on(t.stateId, t.name)],
);

export const refSectors = mysqlTable(
  "ref_sectors",
  {
    id: int("id").autoincrement().primaryKey(),
    code: varchar("code", { length: 80 }).notNull(),
    name: varchar("name", { length: 128 }).notNull(),
    sortOrder: int("sort_order").notNull().default(0),
    isActive: int("is_active").notNull().default(1),
  },
  (t) => [uniqueIndex("ref_sectors_code_uidx").on(t.code)],
);

export const refSubSectors = mysqlTable(
  "ref_sub_sectors",
  {
    id: int("id").autoincrement().primaryKey(),
    sectorId: int("sector_id").notNull(),
    code: varchar("code", { length: 80 }).notNull(),
    name: varchar("name", { length: 128 }).notNull(),
    sortOrder: int("sort_order").notNull().default(0),
    isActive: int("is_active").notNull().default(1),
  },
  (t) => [uniqueIndex("ref_sub_sectors_sector_code_uidx").on(t.sectorId, t.code)],
);

/** Configurable platform enums (employee bands, payable days, org roles, etc.). */
export const platformEnumMasters = mysqlTable(
  "platform_enum_masters",
  {
    id: int("id").autoincrement().primaryKey(),
    enumType: varchar("enum_type", { length: 64 }).notNull(),
    code: varchar("code", { length: 64 }).notNull(),
    label: varchar("label", { length: 150 }).notNull(),
    sortOrder: int("sort_order").notNull().default(0),
    isActive: int("is_active").notNull().default(1),
  },
  (t) => [uniqueIndex("platform_enum_type_code_uidx").on(t.enumType, t.code)],
);
