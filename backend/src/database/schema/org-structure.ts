import { int, mysqlTable, serial, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";
import { organizations } from "./organizations";

export const branches = mysqlTable(
  "branches",
  {
    id: int("id").autoincrement().primaryKey(),
    organizationId: int("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 150 }).notNull(),
    address: varchar("address", { length: 500 }),
    timezone: varchar("timezone", { length: 64 }),
    geoLocation: varchar("geo_location", { length: 255 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (t) => [uniqueIndex("branches_org_name_uidx").on(t.organizationId, t.name)],
);

export const departments = mysqlTable(
  "departments",
  {
    id: int("id").autoincrement().primaryKey(),
    organizationId: int("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    branchId: int("branch_id").references(() => branches.id, { onDelete: "set null" }),
    name: varchar("name", { length: 150 }).notNull(),
    description: varchar("description", { length: 512 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (t) => [uniqueIndex("departments_org_name_uidx").on(t.organizationId, t.name)],
);

export const designations = mysqlTable(
  "designations",
  {
    id: int("id").autoincrement().primaryKey(),
    organizationId: int("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 150 }).notNull(),
    level: varchar("level", { length: 64 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (t) => [uniqueIndex("designations_org_title_uidx").on(t.organizationId, t.title)],
);
