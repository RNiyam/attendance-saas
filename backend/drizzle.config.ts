/// <reference types="node" />
import path from "node:path";
import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: path.join(__dirname, ".env") });

const url = process.env.DATABASE_URL?.trim();
if (!url) {
  throw new Error(
    `[drizzle] DATABASE_URL is empty. Set it in ${path.join(__dirname, ".env")} (postgresql://user:pass@host:5432/dbname).`,
  );
}

const ssl = /supabase\.co/i.test(url) ? { rejectUnauthorized: false } : undefined;

export default defineConfig({
  out: "./drizzle",
  schema: "./src/database/schema/index.ts",
  dialect: "postgresql",
  dbCredentials: {
    url,
    ...(ssl ? { ssl } : {}),
  },
});
