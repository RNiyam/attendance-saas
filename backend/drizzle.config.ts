/// <reference types="node" />
import path from "node:path";
import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Always load backend/.env from this file’s directory (not process.cwd()).
config({ path: path.join(__dirname, ".env") });

const url = process.env.DATABASE_URL?.trim();
if (!url) {
  throw new Error(
    `[drizzle] DATABASE_URL is empty. Set it in ${path.join(__dirname, ".env")} and ensure MySQL is running.`,
  );
}

/**
 * Drizzle Kit uses this file for `generate`, `migrate`, `push`, `studio`.
 * Matches the official MySQL setup: dialect mysql + dbCredentials.url.
 * @see https://orm.drizzle.team/docs/get-started/mysql-new
 */
export default defineConfig({
  out: "./drizzle",
  schema: "./src/database/schema/index.ts",
  dialect: "mysql",
  dbCredentials: {
    url,
  },
});
