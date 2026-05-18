import { boolean, int, mysqlTable, text, timestamp, varchar, uniqueIndex } from "drizzle-orm/mysql-core";
import { organizations } from "./organizations";

/**
 * Per-tenant outbound SMTP. When is_active and credentials decrypt successfully,
 * email.service prefers this over platform SMTP from .env.
 */
export const smtpConfigurations = mysqlTable(
  "smtp_configurations",
  {
    id: int("id").autoincrement().primaryKey(),
    organizationId: int("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    host: varchar("host", { length: 255 }).notNull(),
    port: int("port").notNull(),
    username: varchar("username", { length: 255 }).notNull(),
    passwordEncrypted: text("password_encrypted").notNull(),
    fromEmail: varchar("from_email", { length: 255 }).notNull(),
    fromName: varchar("from_name", { length: 255 }).notNull(),
    secure: boolean("secure").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (t) => [uniqueIndex("smtp_configurations_org_uidx").on(t.organizationId)],
);
