import { integer, pgTable, text, varchar } from "drizzle-orm/pg-core";
import { integrationStatusEnum, webhookStatusEnum } from "./pg-enums";
import { createdAtCol, tableId, updatedAtCol } from "../pg-columns";
import { organizations } from "./organizations";

export const integrationConfigs = pgTable("integration_configs", {
  id: tableId(),
  organizationId: integer("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  provider: varchar("provider", { length: 80 }).notNull(),
  status: integrationStatusEnum("status").notNull().default("inactive"),
  configJson: text("config_json"),
  webhookSecret: varchar("webhook_secret", { length: 128 }),
  createdAt: createdAtCol(),
  updatedAt: updatedAtCol(),
});

export const webhookLogs = pgTable("webhook_logs", {
  id: tableId(),
  organizationId: integer("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  provider: varchar("provider", { length: 80 }).notNull(),
  endpointUrl: varchar("endpoint_url", { length: 512 }).notNull(),
  payload: text("payload"),
  responseCode: integer("response_code"),
  responseBody: text("response_body"),
  status: webhookStatusEnum("status").notNull().default("pending"),
  createdAt: createdAtCol(),
});
