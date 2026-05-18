import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";
import { organizations } from "./organizations";

export const integrationConfigs = mysqlTable("integration_configs", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  provider: varchar("provider", { length: 80 }).notNull(),
  status: mysqlEnum("status", ["active", "inactive"]).notNull().default("inactive"),
  configJson: text("config_json"),
  webhookSecret: varchar("webhook_secret", { length: 128 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const webhookLogs = mysqlTable("webhook_logs", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  provider: varchar("provider", { length: 80 }).notNull(),
  endpointUrl: varchar("endpoint_url", { length: 512 }).notNull(),
  payload: text("payload"),
  responseCode: int("response_code"),
  responseBody: text("response_body"),
  status: mysqlEnum("status", ["pending", "success", "failed"]).notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
