import { date, integer, pgTable, uniqueIndex, varchar } from "drizzle-orm/pg-core";
import { tableId, createdAtCol, updatedAtCol } from "../pg-columns";
import { organizations } from "./organizations";

export const branches = pgTable(
  "branches",
  {
    id: tableId(),
    organizationId: integer("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 150 }).notNull(),
    address: varchar("address", { length: 500 }),
    timezone: varchar("timezone", { length: 64 }),
    geoLocation: varchar("geo_location", { length: 255 }),
    createdAt: createdAtCol(),
    updatedAt: updatedAtCol(),
  },
  (t) => [uniqueIndex("branches_org_name_uidx").on(t.organizationId, t.name)],
);

export const departments = pgTable(
  "departments",
  {
    id: tableId(),
    organizationId: integer("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    branchId: integer("branch_id").references(() => branches.id, { onDelete: "set null" }),
    name: varchar("name", { length: 150 }).notNull(),
    description: varchar("description", { length: 512 }),
    createdAt: createdAtCol(),
    updatedAt: updatedAtCol(),
  },
  (t) => [uniqueIndex("departments_org_name_uidx").on(t.organizationId, t.name)],
);

export const designations = pgTable(
  "designations",
  {
    id: tableId(),
    organizationId: integer("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    departmentId: integer("department_id")
      .notNull()
      .references(() => departments.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 150 }).notNull(),
    level: varchar("level", { length: 64 }),
    createdAt: createdAtCol(),
    updatedAt: updatedAtCol(),
  },
  (t) => [uniqueIndex("designations_org_dept_title_uidx").on(t.organizationId, t.departmentId, t.title)],
);
