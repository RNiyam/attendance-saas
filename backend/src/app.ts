import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { errorHandler } from "./middleware/errorHandler";
import { rateLimit } from "./middleware/rateLimit";
import { requestContext } from "./middleware/requestContext";
import { referenceRouter } from "./modules/reference/reference.routes";
import { authRouter } from "./modules/auth/auth.routes";
import { attendanceRouter } from "./modules/attendance/attendance.routes";
import { employeesRouter } from "./modules/employees/employees.routes";
import { filesRouter } from "./modules/files/files.routes";
import { integrationsRouter } from "./modules/integrations/integrations.routes";
import { leaveRouter } from "./modules/leave/leave.routes";
import { organizationRouter } from "./modules/organization/organization.routes";
import { payrollRouter } from "./modules/payroll/payroll.routes";
import { shiftsRouter } from "./modules/shifts/shifts.routes";
import { settingsRouter } from "./modules/settings/smtp.routes";
import { superAdminRouter } from "./modules/super-admin/super-admin.routes";

export function createApp() {
  const app = express();
  /** JSON APIs should not emit weak ETags; clients may reuse 304 with stale bodies. */
  app.set("etag", false);
  app.use(helmet());
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  app.use(requestContext);

  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.use("/api/auth", rateLimit({ keyPrefix: "rl:auth", windowSeconds: 60, max: 20 }), authRouter);
  app.use("/api/reference", rateLimit({ keyPrefix: "rl:ref", windowSeconds: 60, max: 120 }), referenceRouter);
  app.use("/api/attendance", rateLimit({ keyPrefix: "rl:attendance", windowSeconds: 60, max: 120 }), attendanceRouter);
  app.use("/api/employees", employeesRouter);
  app.use("/api/files", filesRouter);
  app.use("/api/integrations", integrationsRouter);
  app.use("/api/leaves", leaveRouter);
  app.use("/api/organization", organizationRouter);
  app.use("/api/payroll", rateLimit({ keyPrefix: "rl:payroll", windowSeconds: 60, max: 60 }), payrollRouter);
  app.use("/api/shifts", shiftsRouter);
  app.use("/api/settings", settingsRouter);
  app.use("/api/super-admin", superAdminRouter);

  app.use(errorHandler);
  return app;
}
