import {
  boolean,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { tableId } from "../pg-columns";
import { organizations } from "./organizations";
import { users } from "./users";

/** Tenant-scoped role definitions (HR, Manager, etc.). */
export const roles = pgTable(
  "roles",
  {
    id: tableId(),
    organizationId: integer("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
    description: varchar("description", { length: 512 }),
    isSystemRole: boolean("is_system_role").notNull().default(false),
  },
  (t) => [uniqueIndex("roles_org_name_uidx").on(t.organizationId, t.name)],
);

/** Global permission catalog (codes are stable across all tenants). */
export const permissions = pgTable("permissions", {
  id: tableId(),
  code: varchar("code", { length: 128 }).notNull().unique(),
  module: varchar("module", { length: 64 }).notNull(),
  description: text("description"),
});

export const rolePermissions = pgTable(
  "role_permissions",
  {
    roleId: integer("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    permissionId: integer("permission_id")
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),
  },
  (t) => [
    primaryKey({ columns: [t.roleId, t.permissionId] }),
    index("role_permissions_role_id_idx").on(t.roleId),
  ],
);

export const userRoles = pgTable(
  "user_roles",
  {
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    roleId: integer("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.roleId] }),
    index("user_roles_user_id_idx").on(t.userId),
  ],
);
