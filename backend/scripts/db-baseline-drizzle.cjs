#!/usr/bin/env node
/**
 * Fixes "Table already exists" when `npm run db:migrate` runs 0000_init on a DB
 * that was created earlier without Drizzle's __drizzle_migrations journal.
 *
 * Drizzle migrate (MySQL) only looks at MAX(created_at) in __drizzle_migrations
 * and applies every migration whose journal `when` is greater than that value.
 * If the table is empty, it tries to apply ALL .sql files from the start.
 *
 * Usage:
 *   npm run db:baseline
 *     → marks all migrations through the *second-to-last* journal entry as done,
 *       then you run `npm run db:migrate` to apply only the latest one(s).
 *
 *   npm run db:baseline -- --through 0000_init
 *     → mark only 0000 as done (use if your DB truly matches only through that tag).
 *
 *   npm run db:baseline -- --dry-run
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const net = require("net");
const mysql = require("mysql2/promise");

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

function hashMigrationFile(sqlPath) {
  const query = fs.readFileSync(sqlPath, "utf8");
  return crypto.createHash("sha256").update(query).digest("hex");
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
    console.error("DATABASE_URL is empty in backend/.env");
    process.exit(1);
  }

  if (!fs.existsSync(journalPath)) {
    console.error(`Missing ${journalPath}`);
    process.exit(1);
  }

  const journal = JSON.parse(fs.readFileSync(journalPath, "utf8"));
  const entries = journal.entries;
  if (!entries?.length) {
    console.error("Journal has no entries.");
    process.exit(1);
  }
  if (entries.length < 2) {
    console.error("Need at least two journal entries to baseline (pending + already-applied).");
    process.exit(1);
  }

  const pending = entries[entries.length - 1];
  let baselineEntry;
  if (throughTag) {
    baselineEntry = entries.find((e) => e.tag === throughTag);
    if (!baselineEntry) {
      console.error(`Unknown --through tag "${throughTag}". Known: ${entries.map((e) => e.tag).join(", ")}`);
      process.exit(1);
    }
    if (baselineEntry.tag === pending.tag) {
      console.error("Cannot baseline through the pending (last) migration. Pick an earlier tag.");
      process.exit(1);
    }
  } else {
    baselineEntry = entries[entries.length - 2];
  }

  const baselineSqlPath = path.join(drizzleDir, `${baselineEntry.tag}.sql`);
  if (!fs.existsSync(baselineSqlPath)) {
    console.error(`Missing migration file ${baselineSqlPath}`);
    process.exit(1);
  }

  const hash = hashMigrationFile(baselineSqlPath);
  const createdAt = baselineEntry.when;

  const m = url.match(/^mysql:\/\/[^@]+@([^/:]+)(?::(\d+))?\//);
  if (!m) {
    console.error("Could not parse host from DATABASE_URL");
    process.exit(1);
  }
  const host = m[1];
  const port = m[2] ? parseInt(m[2], 10) : 3306;
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
    console.error(`Cannot connect to MySQL at ${host}:${port}`);
    process.exit(1);
  }

  const conn = await mysql.createConnection(url);
  const table = "`__drizzle_migrations`";

  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS ${table} (
        id SERIAL PRIMARY KEY,
        hash TEXT NOT NULL,
        created_at BIGINT
      )
    `);

    const [rows] = await conn.query(`SELECT MAX(created_at) AS m FROM ${table}`);
    const maxCreated = rows[0]?.m != null ? Number(rows[0].m) : null;

    if (maxCreated != null && maxCreated >= pending.when) {
      console.log(
        `__drizzle_migrations already has created_at >= pending migration (${pending.tag}, when=${pending.when}). Nothing to baseline.`,
      );
      console.log("Run: npm run db:migrate");
      return;
    }

    if (maxCreated != null && maxCreated >= createdAt) {
      console.log(
        `Latest migration marker (${maxCreated}) is already at or after baseline "${baselineEntry.tag}" (${createdAt}).`,
      );
      console.log("Try: npm run db:migrate");
      return;
    }

    console.log(
      `Baselining Drizzle journal through "${baselineEntry.tag}" (when=${createdAt}) so pending "${pending.tag}" can run next.`,
    );
    console.log(`(Assumes your database schema already matches everything through ${baselineEntry.tag}.)`);

    if (dryRun) {
      console.log("[dry-run] Would INSERT hash + created_at into __drizzle_migrations");
      return;
    }

    await conn.query(`INSERT INTO ${table} (\`hash\`, \`created_at\`) VALUES (?, ?)`, [hash, createdAt]);
    console.log("Baseline row inserted. Now run: npm run db:migrate");
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
