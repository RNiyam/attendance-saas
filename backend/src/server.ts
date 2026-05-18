import { createApp } from "./app";
import { loadEnv, getEnv } from "./config/env";
import { connectRedis } from "./config/redis";
import { verifySmtpConnection, smtpConfigured } from "./modules/email/smtp.service";
import { startNotificationWorker } from "./modules/notifications/notification-queue";
import { ensureDefaultPlatformAdmin } from "./modules/super-admin/platform-admin.service";

function listenWithFallback(app: ReturnType<typeof createApp>, startPort: number, maxAttempts = 20) {
  const tryPort = (port: number, attemptsLeft: number) => {
    const server = app.listen(port);

    server.once("listening", () => {
      console.info(`[server] Listening on http://localhost:${port}`);
      console.info(`[server] Health: GET http://localhost:${port}/health`);
      if (port !== startPort) {
        console.warn(`[server] Preferred port ${startPort} was busy, using ${port}`);
      }
    });

    server.once("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "EADDRINUSE" && attemptsLeft > 0) {
        console.warn(`[server] Port ${port} in use, trying ${port + 1}...`);
        tryPort(port + 1, attemptsLeft - 1);
        return;
      }
      console.error("[server] Failed to bind port:", err);
      process.exit(1);
    });
  };

  tryPort(startPort, maxAttempts);
}

async function main() {
  loadEnv();
  const env = getEnv();

  if (smtpConfigured()) {
    try {
      await verifySmtpConnection();
    } catch {
      console.warn("[server] Continuing without verified SMTP (check credentials).");
    }
  } else {
    console.warn("[smtp] SMTP not fully configured; outbound emails will be skipped.");
  }

  await ensureDefaultPlatformAdmin().catch((e) => {
    console.warn("[platform-admin] Could not ensure default admin:", e);
  });

  await connectRedis();
  if (getEnv().REDIS_URL) {
    try {
      startNotificationWorker();
      console.info("[notifications] Worker started");
    } catch (e) {
      console.warn("[notifications] Worker failed to start", e);
    }
  }

  const app = createApp();
  listenWithFallback(app, env.PORT);
}

main().catch((err) => {
  console.error("[server] Fatal boot error:", err);
  process.exit(1);
});
