import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { pgSslOption } from "./pg-ssl";

/**
 * PostgreSQL pool for app queries.
 * @see https://orm.drizzle.team/docs/get-started/postgresql-new
 */
const globalForDb = globalThis as unknown as { pool: pg.Pool | undefined };

function createPool() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const ssl = pgSslOption(url);
  return new pg.Pool({
    connectionString: url,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 15_000,
    ...(ssl ? { ssl } : {}),
  });
}

export const pool = globalForDb.pool ?? createPool();
if (process.env.NODE_ENV !== "production") globalForDb.pool = pool;

export const db = drizzle(pool);

export type Database = typeof db;
