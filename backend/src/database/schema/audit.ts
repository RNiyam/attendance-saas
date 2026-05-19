import { integer, pgTable, text, varchar } from "drizzle-orm/pg-core";
import { createdAtCol, tableId } from "../pg-columns";
import { organizations } from "./organizations";
import { users } from "./users";

export const auditLogs = pgTable("audit_logs", {
  id: tableId(),
  organizationId: integer("organization_id").references(() => organizations.id, { onDelete: "set null" }),
  actorUserId: integer("actor_user_id").references(() => users.id, { onDelete: "set null" }),
  action: varchar("action", { length: 120 }).notNull(),
  entityType: varchar("entity_type", { length: 120 }).notNull(),
  entityId: varchar("entity_id", { length: 120 }).notNull(),
  beforeData: text("before_data"),
  afterData: text("after_data"),
  requestId: varchar("request_id", { length: 64 }),
  createdAt: createdAtCol(),
});

export const activityLogs = pgTable("activity_logs", {
  id: tableId(),
  organizationId: integer("organization_id").references(() => organizations.id, { onDelete: "set null" }),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  activityType: varchar("activity_type", { length: 120 }).notNull(),
  metadata: text("metadata"),
  ipAddress: varchar("ip_address", { length: 64 }),
  createdAt: createdAtCol(),
});
