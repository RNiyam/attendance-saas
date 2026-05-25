#!/usr/bin/env node
/**
 * Fixes "relation already exists" when `npm run db:migrate` runs 0000_init on a DB
 * that was created earlier without Drizzle's __drizzle_migrations journal.
 *
 * Usage:
 *   npm run db:baseline
 *     → marks all migrations through the *second-to-last* journal entry as done,
 *       then you run `npm run db:migrate` to apply only the latest one(s).
 *
 *   npm run db:baseline -- --through 0000_init
 *   npm run db:baseline -- --dry-run
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const net = require("net");
const { Client } = require("pg");

const backendRoot = path.join(__dirname, "..");
const envPath = path.join(backendRoot, ".env");
const drizzleDir = path.join(backendRoot, "drizzle");
const journalPath = path.join(drizzleDir, "meta", "_journal.json");

function parseArgs(argv) {
  let throughTag = null;
  let dryRun = false;
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") dryRun = true;
    else if (a === "--through" && argv[i + 1]) {
      throughTag = argv[++i];
    }
  }
  return { throughTag, dryRun };
}

function hashFile(filePath) {
  const buf = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(buf).digest("hex");
}

async function main() {
  const { throughTag, dryRun } = parseArgs(process.argv);

  if (!fs.existsSync(envPath)) {
    console.error(`Missing ${envPath}`);
    process.exit(1);
  }
  require("dotenv").config({ path: envPath });

  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    console.error("DATABASE_URL is empty");
    process.exit(1);
  }

  const m = url.match(/^postgres(?:ql)?:\/\/[^@]+@([^/:]+)(?::(\d+))?\//);
  if (!m) {
    console.error("Could not parse host from DATABASE_URL");
    process.exit(1);
  }
  const host = m[1];
  const port = m[2] ? parseInt(m[2], 10) : 5432;

  const reachable = await new Promise((resolve) => {
    const socket = net.connect({ host, port, timeout: 5000 });
    socket.on("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.on("error", () => resolve(false));
    socket.on("timeout", () => {
      socket.destroy();
      resolve(false);
    });
  });

  if (!reachable) {
    console.error(`Cannot connect to PostgreSQL at ${host}:${port}`);
    process.exit(1);
  }

  if (!fs.existsSync(journalPath)) {
    console.error(`Missing journal: ${journalPath}`);
    process.exit(1);
  }

  const journal = JSON.parse(fs.readFileSync(journalPath, "utf8"));
  const entries = journal.entries ?? [];
  if (!entries.length) {
    console.error("Journal has no entries");
    process.exit(1);
  }

  let endIdx = entries.length - 2;
  if (throughTag) {
    endIdx = entries.findIndex((e) => e.tag === throughTag);
    if (endIdx < 0) {
      console.error(`Tag not found in journal: ${throughTag}`);
      process.exit(1);
    }
  }

  const toMark = entries.slice(0, endIdx + 1);
  console.log(
    dryRun ? "[dry-run] Would mark:" : "Marking as applied:",
    toMark.map((e) => e.tag).join(", "),
  );

  if (dryRun) return;

  const client = new Client({ connectionString: url });
  await client.connect();

  await client.query(`
    CREATE TABLE IF NOT EXISTS "__drizzle_migrations" (
      id SERIAL PRIMARY KEY,
      hash text NOT NULL,
      created_at bigint
    )
  `);

  for (const entry of toMark) {
    const sqlPath = path.join(drizzleDir, `${entry.tag}.sql`);
    if (!fs.existsSync(sqlPath)) {
      console.error(`Missing migration file: ${sqlPath}`);
      process.exit(1);
    }
    const hash = hashFile(sqlPath);
    const createdAt = entry.when;
    await client.query(
      `INSERT INTO "__drizzle_migrations" (hash, created_at) VALUES ($1, $2)`,
      [hash, createdAt],
    );
    console.log(`  ✓ ${entry.tag}`);
  }

  await client.end();
  console.log("\nDone. Run: npm run db:migrate");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
