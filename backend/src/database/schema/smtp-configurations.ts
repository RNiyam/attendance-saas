import { boolean, integer, pgTable, text, varchar, uniqueIndex } from "drizzle-orm/pg-core";
import { createdAtCol, tableId, updatedAtCol } from "../pg-columns";
import { organizations } from "./organizations";

/**
 * Per-tenant outbound SMTP. When is_active and credentials decrypt successfully,
 * email.service prefers this over platform SMTP from .env.
 */
export const smtpConfigurations = pgTable(
  "smtp_configurations",
  {
    id: tableId(),
    organizationId: integer("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    host: varchar("host", { length: 255 }).notNull(),
    port: integer("port").notNull(),
    username: varchar("username", { length: 255 }).notNull(),
    passwordEncrypted: text("password_encrypted").notNull(),
    fromEmail: varchar("from_email", { length: 255 }).notNull(),
    fromName: varchar("from_name", { length: 255 }).notNull(),
    secure: boolean("secure").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: createdAtCol(),
    updatedAt: updatedAtCol(),
  },
  (t) => [uniqueIndex("smtp_configurations_org_uidx").on(t.organizationId)],
);
