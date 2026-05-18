#!/usr/bin/env node
/**
 * Runs drizzle-kit migrate after verifying DATABASE_URL is reachable.
 * Parses host/port from mysql://user:pass@host:port/db
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

const m = url.match(/^mysql:\/\/[^@]+@([^/:]+)(?::(\d+))?\//);
if (!m) {
  console.error("Could not parse host from DATABASE_URL (expected mysql://user:pass@host:port/db)");
  process.exit(1);
}
const host = m[1];
const port = m[2] ? parseInt(m[2], 10) : 3306;

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
Cannot connect to MySQL at ${host}:${port} (nothing is listening).

Do one of the following:
  • Start your MySQL server (however you usually run it), then run: npm run db:migrate
  • Or install Homebrew MySQL on this Mac, then:
      brew install mysql
      brew services start mysql
    Then create the database if needed and keep DATABASE_URL in backend/.env in sync.

Current DATABASE_URL host: ${host}  port: ${port}
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
