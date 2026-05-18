import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

/**
 * mysql2 pool for app queries. Drizzle docs recommend a single connection
 * for DDL migrate(); we use pool for normal API traffic.
 * @see https://orm.drizzle.team/docs/get-started/mysql-new
 */
const globalForDb = globalThis as unknown as { pool: mysql.Pool | undefined };

function createPool() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return mysql.createPool(url);
}

export const pool = globalForDb.pool ?? createPool();
if (process.env.NODE_ENV !== "production") globalForDb.pool = pool;

export const db = drizzle(pool);

export type Database = typeof db;
