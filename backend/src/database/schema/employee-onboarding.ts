import { int, mysqlEnum, mysqlTable, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";
import { employees } from "./employees";
import { organizations } from "./organizations";

export const employeeOnboardingInvites = mysqlTable(
  "employee_onboarding_invites",
  {
    id: int("id").autoincrement().primaryKey(),
    organizationId: int("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    employeeId: int("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    email: varchar("email", { length: 255 }).notNull(),
    token: varchar("token", { length: 128 }).notNull(),
    status: mysqlEnum("status", ["pending", "accepted", "expired", "revoked"])
      .notNull()
      .default("pending"),
    expiresAt: timestamp("expires_at").notNull(),
    acceptedAt: timestamp("accepted_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (t) => [uniqueIndex("employee_invites_token_uidx").on(t.token)],
);
