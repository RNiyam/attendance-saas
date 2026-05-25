import { date, serial, timestamp } from "drizzle-orm/pg-core";

export const tableId = () => serial("id").primaryKey();

/** Calendar date stored as PostgreSQL `date`, read/written as JS `Date`. */
export const dateCol = (name: string) => date(name, { mode: "date" });

export const createdAtCol = () => timestamp("created_at", { mode: "date" }).defaultNow().notNull();

export const updatedAtCol = () =>
  timestamp("updated_at", { mode: "date" }).defaultNow().notNull().$onUpdateFn(() => new Date());
