import type { NextFunction, Request, Response } from "express";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { db } from "../database";
import { permissions, rolePermissions, userRoles } from "../database/schema";
import { getEnv } from "../config/env";

export type AuthedRequest = Request & {
  user?: { id: number; organizationId: number; email: string; permissions: string[] };
};

export function authMiddleware(req: AuthedRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing bearer token" });
    return;
  }
  const token = header.slice("Bearer ".length);
  try {
    const env = getEnv();
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as unknown as {
      sub: number;
      orgId: number;
      email: string;
      typ?: string;
    };
    if (payload.typ && payload.typ !== "access") {
      res.status(401).json({ error: "Invalid token type" });
      return;
    }
    req.user = { id: payload.sub, organizationId: payload.orgId, email: payload.email, permissions: [] };
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired access token" });
  }
}

export async function resolvePermissions(req: AuthedRequest, _res: Response, next: NextFunction): Promise<void> {
  if (!req.user) {
    next();
    return;
  }
  const roleRows = await db
    .select({ roleId: userRoles.roleId })
    .from(userRoles)
    .where(eq(userRoles.userId, req.user.id));

  if (roleRows.length === 0) {
    req.user.permissions = [];
    next();
    return;
  }

  const codes = new Set<string>();
  for (const row of roleRows) {
    const mapped = await db
      .select({ code: permissions.code })
      .from(rolePermissions)
      .innerJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
      .where(eq(rolePermissions.roleId, row.roleId));
    mapped.forEach((m) => codes.add(m.code));
  }
  req.user.permissions = Array.from(codes);
  next();
}

export function requirePermission(permissionCode: string) {
  return (req: AuthedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    if (!req.user.permissions.includes(permissionCode)) {
      res.status(403).json({ error: `Missing permission: ${permissionCode}` });
      return;
    }
    next();
  };
}

/** Permissions that imply the user may configure org-wide attendance (not plain clock-in staff). */
const SAVE_DEFAULT_ATTENDANCE_TEMPLATE_ELEVATED = new Set<string>([
  "ADJUST_ATTENDANCE",
  "MANAGE_SHIFTS",
  "ASSIGN_SHIFTS",
  "VIEW_SHIFTS",
  "CREATE_EMPLOYEE",
  "UPDATE_EMPLOYEE",
  "INVITE_EMPLOYEE",
  "VIEW_EMPLOYEE",
  "APPROVE_LEAVE",
  "MANAGE_BRANCHES",
  "MANAGE_DEPARTMENTS",
  "MANAGE_DESIGNATIONS",
  "MANAGE_LEAVE_TYPES",
  "RUN_PAYROLL",
  "MANAGE_INTEGRATIONS",
]);

/** Save default attendance template: must view attendance + have any HR/admin/manager-type permission (blocks EMPLOYEE/OTHERS). */
export function requireSaveDefaultAttendanceTemplate() {
  return (req: AuthedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const p = new Set(req.user.permissions);
    if (!p.has("VIEW_ATTENDANCE")) {
      res.status(403).json({ error: "Missing permission: VIEW_ATTENDANCE" });
      return;
    }
    const hasElevated = [...SAVE_DEFAULT_ATTENDANCE_TEMPLATE_ELEVATED].some((code) => p.has(code));
    if (!hasElevated) {
      res.status(403).json({
        error:
          "Insufficient permissions to edit the default attendance template. Ask an admin to grant HR, Manager, or attendance-admin access.",
      });
      return;
    }
    next();
  };
}

/** Pass if the user has at least one of the listed permissions (OR). */
export function requireAnyPermission(permissionCodes: readonly string[]) {
  return (req: AuthedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const ok = permissionCodes.some((c) => req.user!.permissions.includes(c));
    if (!ok) {
      res.status(403).json({
        error: `Missing permission: need one of ${permissionCodes.join(", ")}`,
      });
      return;
    }
    next();
  };
}
