#!/usr/bin/env node
/**
 * Runs drizzle-kit migrate after verifying DATABASE_URL is reachable.
 * Supports postgresql://user:pass@host:port/db
 */
const fs = require("fs");
const path = require("path");
const net = require("net");
const { spawnSync } = require("child_process");

const backendRoot = path.join(__dirname, "..");
const envPath = path.join(backendRoot, ".env");

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

function parseHostPort(connectionString) {
  const withoutScheme = connectionString.replace(/^postgres(?:ql)?:\/\//, "");
  const at = withoutScheme.lastIndexOf("@");
  if (at === -1) return null;
  const hostPart = withoutScheme.slice(at + 1);
  const m = hostPart.match(/^([^/:?]+)(?::(\d+))?/);
  if (!m) return null;
  return { host: m[1], port: m[2] ? parseInt(m[2], 10) : 5432 };
}

const parsed = parseHostPort(url);
if (!parsed) {
  console.error(
    "Could not parse host from DATABASE_URL (expected postgresql://user:pass@host:port/db)",
  );
  process.exit(1);
}
const { host, port } = parsed;

const ok = new Promise((resolve) => {
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

ok.then((reachable) => {
  if (!reachable) {
    console.error(`
Cannot connect to PostgreSQL at ${host}:${port} (nothing is listening).

Start PostgreSQL, create the database, then set DATABASE_URL in backend/.env, e.g.:
  postgresql://postgres:postgres@localhost:5432/attendance_saas

Then run: npm run db:migrate
`);
    process.exit(1);
  }

  const r = spawnSync("npx", ["drizzle-kit", "migrate"], {
    cwd: backendRoot,
    stdio: "inherit",
    env: process.env,
  });
  process.exit(r.status ?? 1);
});
