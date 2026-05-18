import { int, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";
import { organizations } from "./organizations";
import { users } from "./users";

export const auditLogs = mysqlTable("audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organization_id").references(() => organizations.id, { onDelete: "set null" }),
  actorUserId: int("actor_user_id").references(() => users.id, { onDelete: "set null" }),
  action: varchar("action", { length: 120 }).notNull(),
  entityType: varchar("entity_type", { length: 120 }).notNull(),
  entityId: varchar("entity_id", { length: 120 }).notNull(),
  beforeData: text("before_data"),
  afterData: text("after_data"),
  requestId: varchar("request_id", { length: 64 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const activityLogs = mysqlTable("activity_logs", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organization_id").references(() => organizations.id, { onDelete: "set null" }),
  userId: int("user_id").references(() => users.id, { onDelete: "set null" }),
  activityType: varchar("activity_type", { length: 120 }).notNull(),
  metadata: text("metadata"),
  ipAddress: varchar("ip_address", { length: 64 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
