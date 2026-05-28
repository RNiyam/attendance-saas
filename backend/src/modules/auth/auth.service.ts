import { createHash, randomBytes, randomInt, randomUUID } from "node:crypto";
import bcrypt from "bcrypt";
import { and, desc, eq, sql, ilike, or } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { db } from "../../database/index";
import {
  authSessions,
  employees,
  employeeFaces,
  organizations,
  permissions,
  rolePermissions,
  roles,
  userRoles,
  users,
} from "../../database/schema/index";
import { getEnv } from "../../config/env";
import { writeActivityLog } from "../../utils/audit";
import { sendWelcomeEmail, sendOnboardingRoleWelcomeEmail } from "../email/email.service";
import { INDIAN_STATES, listCitiesForState } from "../reference/india-geo.data";
import { findSector } from "../reference/sectors.data";

const BCRYPT_ROUNDS = 12;
const MAX_FAILED_LOGIN_ATTEMPTS = 5;
const ACCOUNT_LOCK_MINUTES = 15;
const TEMP_PASSWORD_EXPIRES_HOURS = 24;

const DEFAULT_PERMISSIONS: { code: string; module: string; description: string }[] = [
  { code: "CREATE_EMPLOYEE", module: "employees", description: "Create employees" },
  { code: "UPDATE_EMPLOYEE", module: "employees", description: "Update employees" },
  { code: "VIEW_EMPLOYEE", module: "employees", description: "View employees" },
  { code: "INVITE_EMPLOYEE", module: "employees", description: "Invite employee for onboarding" },
  { code: "VIEW_ATTENDANCE", module: "attendance", description: "View attendance" },
  { code: "APPROVE_LEAVE", module: "leave", description: "Approve leave requests" },
  { code: "RUN_PAYROLL", module: "payroll", description: "Run payroll" },
  { code: "MANAGE_BRANCHES", module: "organization", description: "Create/update branches" },
  { code: "MANAGE_DEPARTMENTS", module: "organization", description: "Create/update departments" },
  { code: "MANAGE_DESIGNATIONS", module: "organization", description: "Create/update designations" },
  { code: "MANAGE_SHIFTS", module: "shifts", description: "Create/update shifts" },
  { code: "ASSIGN_SHIFTS", module: "shifts", description: "Assign shifts to employees" },
  { code: "VIEW_SHIFTS", module: "shifts", description: "View shifts and policies" },
  { code: "MARK_ATTENDANCE", module: "attendance", description: "Mark check-in/check-out attendance" },
  { code: "ADJUST_ATTENDANCE", module: "attendance", description: "Create attendance adjustments" },
  { code: "REQUEST_LEAVE", module: "leave", description: "Request leave" },
  { code: "MANAGE_LEAVE_TYPES", module: "leave", description: "Create/update leave types" },
  { code: "MANAGE_INTEGRATIONS", module: "integrations", description: "Manage external integrations" },
];

type SystemRoleDefinition = {
  name: "OWNER" | "ADMIN" | "HR" | "MANAGER" | "EMPLOYEE" | "OTHERS";
  description: string;
  codes: string[];
};

const SYSTEM_ROLE_DEFINITIONS: SystemRoleDefinition[] = [
  { name: "OWNER", description: "Organization owner", codes: DEFAULT_PERMISSIONS.map((x) => x.code) },
  {
    name: "ADMIN",
    description: "Organization administrator",
    codes: [
      "CREATE_EMPLOYEE",
      "UPDATE_EMPLOYEE",
      "VIEW_EMPLOYEE",
      "INVITE_EMPLOYEE",
      "VIEW_ATTENDANCE",
      "APPROVE_LEAVE",
      "MANAGE_BRANCHES",
      "MANAGE_DEPARTMENTS",
      "MANAGE_DESIGNATIONS",
      "MANAGE_SHIFTS",
      "ASSIGN_SHIFTS",
      "VIEW_SHIFTS",
      "MARK_ATTENDANCE",
      "ADJUST_ATTENDANCE",
      "REQUEST_LEAVE",
      "MANAGE_LEAVE_TYPES",
      "MANAGE_INTEGRATIONS",
    ],
  },
  {
    name: "HR",
    description: "Human resources",
    codes: [
      "CREATE_EMPLOYEE",
      "UPDATE_EMPLOYEE",
      "VIEW_EMPLOYEE",
      "INVITE_EMPLOYEE",
      "VIEW_ATTENDANCE",
      "APPROVE_LEAVE",
      "MANAGE_SHIFTS",
      "ASSIGN_SHIFTS",
      "VIEW_SHIFTS",
      "MARK_ATTENDANCE",
      "ADJUST_ATTENDANCE",
      "REQUEST_LEAVE",
      "MANAGE_LEAVE_TYPES",
    ],
  },
  {
    name: "MANAGER",
    description: "Team manager",
    codes: [
      "VIEW_ATTENDANCE",
      "APPROVE_LEAVE",
      "VIEW_EMPLOYEE",
      "VIEW_SHIFTS",
      "MARK_ATTENDANCE",
      "REQUEST_LEAVE",
    ],
  },
  {
    name: "EMPLOYEE",
    description: "Individual contributor",
    codes: ["VIEW_ATTENDANCE", "MARK_ATTENDANCE", "REQUEST_LEAVE"],
  },
  {
    name: "OTHERS",
    description: "Other contributor",
    codes: ["VIEW_ATTENDANCE", "MARK_ATTENDANCE", "REQUEST_LEAVE"],
  },
];

function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

async function ensureGlobalPermissions(): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  for (const p of DEFAULT_PERMISSIONS) {
    const [existing] = await db.select().from(permissions).where(eq(permissions.code, p.code)).limit(1);
    if (existing) {
      map.set(p.code, existing.id);
      continue;
    }
    await db.insert(permissions).values(p);
    const [row] = await db.select().from(permissions).where(eq(permissions.code, p.code)).limit(1);
    if (row) map.set(p.code, row.id);
  }
  return map;
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function seedRbacForOrganization(
  organizationId: number,
  tx: Tx,
  permMap: Map<string, number>,
): Promise<{ ownerRoleId: number }> {
  const createdRoleIds: Record<string, number> = {};

  for (const r of SYSTEM_ROLE_DEFINITIONS) {
    const [existingRole] = await tx
      .select()
      .from(roles)
      .where(and(eq(roles.organizationId, organizationId), eq(roles.name, r.name)))
      .limit(1);

    let role = existingRole;
    if (!role) {
      await tx.insert(roles).values({
        organizationId,
        name: r.name,
        description: r.description,
        isSystemRole: true,
      });
      const [inserted] = await tx
        .select()
        .from(roles)
        .where(and(eq(roles.organizationId, organizationId), eq(roles.name, r.name)))
        .limit(1);
      role = inserted;
    }
    if (!role) throw new Error(`Failed to upsert role ${r.name}`);
    createdRoleIds[r.name] = role.id;

    await tx.delete(rolePermissions).where(eq(rolePermissions.roleId, role.id));
    const rows = r.codes
      .map((code) => {
        const pid = permMap.get(code);
        if (!pid) return null;
        return { roleId: role.id, permissionId: pid };
      })
      .filter(Boolean) as { roleId: number; permissionId: number }[];
    if (rows.length) await tx.insert(rolePermissions).values(rows);
  }

  return { ownerRoleId: createdRoleIds.OWNER };
}

async function ensureExtraOrgRoles(tx: Tx, organizationId: number, permMap: Map<string, number>) {
  for (const r of SYSTEM_ROLE_DEFINITIONS) {
    const [existing] = await tx
      .select()
      .from(roles)
      .where(and(eq(roles.organizationId, organizationId), eq(roles.name, r.name)))
      .limit(1);
    if (existing) continue;
    await tx.insert(roles).values({
      organizationId,
      name: r.name,
      description: r.description,
      isSystemRole: true,
    });
    const [role] = await tx
      .select()
      .from(roles)
      .where(and(eq(roles.organizationId, organizationId), eq(roles.name, r.name)))
      .limit(1);
    if (!role) continue;
    const rows = r.codes
      .map((code) => {
        const pid = permMap.get(code);
        if (!pid) return null;
        return { roleId: role.id, permissionId: pid };
      })
      .filter(Boolean) as { roleId: number; permissionId: number }[];
    if (rows.length) await tx.insert(rolePermissions).values(rows);
  }
}

const ROLE_DISPLAY_PRIORITY = ["OWNER", "ADMIN", "HR", "MANAGER", "EMPLOYEE", "OTHERS"] as const;

function pickPrimaryRoleName(names: string[]): string {
  const unique = [...new Set(names.map((n) => n.trim().toUpperCase()).filter(Boolean))];
  if (unique.length === 0) return "";
  if (unique.length === 1) return unique[0];

  let best = "";
  let bestIdx = 999;
  const order = ROLE_DISPLAY_PRIORITY as readonly string[];
  for (const n of unique) {
    const idx = order.indexOf(n);
    if (idx !== -1 && idx < bestIdx) {
      bestIdx = idx;
      best = n;
    }
  }
  return best;
}

function signAccessToken(user: { id: number; organizationId: number; email: string }): string {
  const env = getEnv();
  return jwt.sign(
    { sub: user.id, orgId: user.organizationId, email: user.email, typ: "access" },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions["expiresIn"] },
  );
}

function signRefreshToken(sessionId: number, userId: number): string {
  const env = getEnv();
  return jwt.sign(
    { sid: sessionId, sub: userId, typ: "refresh" },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions["expiresIn"] },
  );
}

function generateTemporaryPassword(): string {
  const lower = "abcdefghijkmnopqrstuvwxyz";
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const numbers = "23456789";
  const special = "!@#$%";
  const all = `${lower}${upper}${numbers}${special}`;
  const required = [
    lower[randomBytes(1)[0] % lower.length],
    upper[randomBytes(1)[0] % upper.length],
    numbers[randomBytes(1)[0] % numbers.length],
    special[randomBytes(1)[0] % special.length],
  ];
  const rest = Array.from({ length: 8 }, () => all[randomBytes(1)[0] % all.length]);
  return [...required, ...rest].sort(() => randomBytes(1)[0] - 128).join("");
}

async function createSessionTokens(user: { id: number; organizationId: number; email: string }) {
  const env = getEnv();
  const refreshExpires = new Date();
  const days = parseDurationToDays(env.JWT_REFRESH_EXPIRES_IN) ?? 7;
  refreshExpires.setDate(refreshExpires.getDate() + days);

  await db.insert(authSessions).values({
    userId: user.id,
    refreshTokenHash: "",
    expiresAt: refreshExpires,
  });
  const [session] = await db
    .select()
    .from(authSessions)
    .where(eq(authSessions.userId, user.id))
    .orderBy(desc(authSessions.id))
    .limit(1);
  if (!session) throw new Error("Failed to create session");

  const refreshToken = signRefreshToken(session.id, user.id);
  await db
    .update(authSessions)
    .set({ refreshTokenHash: hashRefreshToken(refreshToken) })
    .where(eq(authSessions.id, session.id));

  return { accessToken: signAccessToken(user), refreshToken };
}

export type SignupInput = {
  organizationName: string;
  organizationSlug?: string;
  ownerEmail: string;
  ownerDisplayName?: string;
  appLoginUrl?: string;
};

function organizationCodePrefix(name: string): string {
  const letters = name.toUpperCase().replace(/[^A-Z]/g, "");
  return (letters || "WORK").slice(0, 4).padEnd(4, "X");
}

function normalizeOrganizationCode(code: string): string {
  return code.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function isOrganizationCode(code: string): boolean {
  return /^[A-Z]{4}\d{4}$/.test(code);
}

async function generateUniqueOrganizationCode(organizationName: string): Promise<string> {
  const prefix = organizationCodePrefix(organizationName);
  for (let i = 0; i < 100; i += 1) {
    const suffix = randomInt(0, 10_000).toString().padStart(4, "0");
    const code = `${prefix}${suffix}`;
    const [existing] = await db.select({ id: organizations.id }).from(organizations).where(eq(organizations.slug, code)).limit(1);
    if (!existing) return code;
  }
  throw new Error("Could not generate a unique organization code");
}

export async function previewOrganizationCode(organizationName: string): Promise<{ organizationCode: string }> {
  return { organizationCode: await generateUniqueOrganizationCode(organizationName) };
}

function appendSignupParams(url: string, organizationCode: string, email: string): string {
  const u = new URL(url);
  u.searchParams.set("org", organizationCode);
  u.searchParams.set("email", email);
  return u.toString();
}

export async function signup(input: SignupInput) {
  const organizationCode = input.organizationSlug
    ? normalizeOrganizationCode(input.organizationSlug)
    : await generateUniqueOrganizationCode(input.organizationName);

  if (!isOrganizationCode(organizationCode)) {
    const err = new Error("Organization code must be 4 uppercase letters followed by 4 numbers");
    (err as { status?: number }).status = 400;
    throw err;
  }

  const [existingOrg] = await db.select().from(organizations).where(eq(organizations.slug, organizationCode)).limit(1);
  if (existingOrg) {
    const err = new Error("Organization code already taken");
    (err as { status?: number }).status = 409;
    throw err;
  }

  const permMap = await ensureGlobalPermissions();

  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await bcrypt.hash(temporaryPassword, BCRYPT_ROUNDS);
  const temporaryPasswordExpiresAt = new Date(Date.now() + TEMP_PASSWORD_EXPIRES_HOURS * 60 * 60 * 1000);
  const orgUuid = randomUUID();
  const userUuid = randomUUID();

  const result = await db.transaction(async (tx) => {
    await tx.insert(organizations).values({
      uuid: orgUuid,
      name: input.organizationName,
      slug: organizationCode,
      email: input.ownerEmail,
    });
    const [org] = await tx.select().from(organizations).where(eq(organizations.slug, organizationCode)).limit(1);
    if (!org) throw new Error("Failed to create organization");

    await seedRbacForOrganization(org.id, tx, permMap);

    await tx.insert(users).values({
      organizationId: org.id,
      uuid: userUuid,
      email: input.ownerEmail.toLowerCase(),
      passwordHash,
      passwordChangeRequired: true,
      temporaryPasswordExpiresAt,
      status: "active",
    });
    const [user] = await tx
      .select()
      .from(users)
      .where(and(eq(users.organizationId, org.id), eq(users.email, input.ownerEmail.toLowerCase())))
      .limit(1);
    if (!user) throw new Error("Failed to create user");

    // Role is assigned when the user completes personal details in onboarding (organizationRole).

    return { org, user };
  });

  const display = input.ownerDisplayName?.trim() || input.ownerEmail;
  const setupUrl =
    input.appLoginUrl
      ? appendSignupParams(input.appLoginUrl, organizationCode, input.ownerEmail.toLowerCase())
      : `https://app.example.com/complete-signup?org=${organizationCode}&email=${encodeURIComponent(input.ownerEmail.toLowerCase())}`;
  void sendWelcomeEmail({
    organizationId: result.org.id,
    to: input.ownerEmail,
    userName: display,
    organizationName: input.organizationName,
    loginUrl: setupUrl,
    temporaryPassword,
    temporaryPasswordExpiresInHours: TEMP_PASSWORD_EXPIRES_HOURS,
  }).catch((e) => console.error("[signup] welcome email failed:", e));
  await writeActivityLog({
    organizationId: result.org.id,
    userId: result.user.id,
    activityType: "auth.signup",
    metadata: { email: result.user.email },
  });

  return {
    organization: { id: result.org.id, name: result.org.name, slug: result.org.slug },
    user: { id: result.user.id, email: result.user.email },
    requiresPasswordChange: true,
    message: "Workspace created. Check your email for the temporary password.",
  };
}

function parseDurationToDays(s: string): number | null {
  const m = /^(\d+)d$/i.exec(s.trim());
  if (m) return Number(m[1]);
  return null;
}

export type LoginInput = { organizationSlug?: string; identifier: string; password: string };
export type CompletePasswordSetupInput = {
  organizationSlug: string;
  email: string;
  temporaryPassword: string;
  newPassword: string;
};

async function resolveLoginUserAndOrg(input: LoginInput) {
  const identifier = input.identifier.trim().toLowerCase();
  const slugRaw = input.organizationSlug?.trim();

  const isEmail = identifier.includes("@");
  
  const nameCondition = or(
    ilike(users.firstName, identifier),
    ilike(users.lastName, identifier),
    eq(sql`lower(trim(concat(${users.firstName}, ' ', ${users.lastName})))`, identifier),
    eq(sql`lower(concat(${users.firstName}, ${users.lastName}))`, identifier)
  );

  if (slugRaw) {
    const organizationCode = normalizeOrganizationCode(slugRaw);
    const [org] = await db.select().from(organizations).where(eq(organizations.slug, organizationCode)).limit(1);
    if (!org) {
      const err = new Error("Invalid credentials");
      (err as { status?: number }).status = 401;
      throw err;
    }
    const [user] = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.organizationId, org.id),
          isEmail ? eq(users.email, identifier) : nameCondition
        )
      )
      .limit(1);
    if (!user || user.status !== "active") {
      const err = new Error("Invalid credentials");
      (err as { status?: number }).status = 401;
      throw err;
    }
    return { org, user };
  }

  const matches = await db
    .select({ user: users, org: organizations })
    .from(users)
    .innerJoin(organizations, eq(users.organizationId, organizations.id))
    .where(
      and(
        isEmail ? eq(users.email, identifier) : nameCondition,
        eq(users.status, "active")
      )
    );

  if (matches.length === 0) {
    const err = new Error("Invalid credentials");
    (err as { status?: number }).status = 401;
    throw err;
  }
  if (matches.length > 1) {
    const err = new Error(
      "This email is linked to more than one workspace. Ask your administrator which organization code to use.",
    );
    (err as { status?: number }).status = 409;
    throw err;
  }
  return { org: matches[0].org, user: matches[0].user };
}

export async function login(input: LoginInput) {
  const { org, user } = await resolveLoginUserAndOrg(input);
  if (user.accountLockedUntil && new Date(user.accountLockedUntil) > new Date()) {
    const err = new Error("Account temporarily locked due to failed login attempts");
    (err as { status?: number }).status = 423;
    throw err;
  }
  const ok = await bcrypt.compare(input.password, user.passwordHash);
  if (!ok) {
    const failed = (user.failedLoginAttempts ?? 0) + 1;
    const lockUntil =
      failed >= MAX_FAILED_LOGIN_ATTEMPTS ? new Date(Date.now() + ACCOUNT_LOCK_MINUTES * 60_000) : null;
    await db
      .update(users)
      .set({
        failedLoginAttempts: failed,
        accountLockedUntil: lockUntil,
      })
      .where(eq(users.id, user.id));
    const err = new Error("Invalid credentials");
    (err as { status?: number }).status = 401;
    throw err;
  }

  if (user.passwordChangeRequired) {
    const expiresAt = user.temporaryPasswordExpiresAt
      ? new Date(user.temporaryPasswordExpiresAt)
      : null;
    if (expiresAt && expiresAt < new Date()) {
      const err = new Error("Temporary password expired. Ask an administrator to resend setup access.");
      (err as { status?: number }).status = 410;
      throw err;
    }
    return {
      requiresPasswordChange: true,
      user: { id: user.id, email: user.email, organizationId: org.id },
      organization: { id: org.id, name: org.name, slug: org.slug },
    };
  }

  await db
    .update(users)
    .set({ lastLoginAt: new Date(), failedLoginAttempts: 0, accountLockedUntil: null })
    .where(eq(users.id, user.id));

  // Session invalidation policy: drop expired sessions and cap at latest 5.
  await db.delete(authSessions).where(and(eq(authSessions.userId, user.id), sql`${authSessions.expiresAt} < now()`));
  const sessions = await db.select().from(authSessions).where(eq(authSessions.userId, user.id)).orderBy(desc(authSessions.id));
  if (sessions.length > 5) {
    const toDelete = sessions.slice(5).map((s) => s.id);
    for (const sid of toDelete) {
      await db.delete(authSessions).where(eq(authSessions.id, sid));
    }
  }

  const { accessToken, refreshToken } = await createSessionTokens(user);
  await writeActivityLog({
    organizationId: org.id,
    userId: user.id,
    activityType: "auth.login",
    metadata: { email: user.email },
  });

  const roleRows = await db
    .select({ roleName: roles.name })
    .from(userRoles)
    .innerJoin(roles, eq(roles.id, userRoles.roleId))
    .where(eq(userRoles.userId, user.id));

  const onboardingCompleted = Boolean(org?.legalName?.trim());
  const roleAssigned = roleRows.length > 0;

  return {
    accessToken,
    refreshToken,
    user: { id: user.id, email: user.email, organizationId: org.id },
    organization: { id: org.id, name: org.name, slug: org.slug },
    onboardingCompleted,
    roleAssigned,
  };
}

export async function completePasswordSetup(input: CompletePasswordSetupInput) {
  const organizationCode = normalizeOrganizationCode(input.organizationSlug);
  const [org] = await db.select().from(organizations).where(eq(organizations.slug, organizationCode)).limit(1);
  if (!org) {
    const err = new Error("Invalid credentials");
    (err as { status?: number }).status = 401;
    throw err;
  }
  const [user] = await db
    .select()
    .from(users)
    .where(and(eq(users.organizationId, org.id), eq(users.email, input.email.toLowerCase())))
    .limit(1);
  if (!user || user.status !== "active" || !user.passwordChangeRequired) {
    const err = new Error("Password setup is not available for this account");
    (err as { status?: number }).status = 400;
    throw err;
  }
  const expiresAt = user.temporaryPasswordExpiresAt
    ? new Date(user.temporaryPasswordExpiresAt)
    : null;
  if (!expiresAt || expiresAt < new Date()) {
    const err = new Error("Temporary password expired. Ask an administrator to resend setup access.");
    (err as { status?: number }).status = 410;
    throw err;
  }
  const ok = await bcrypt.compare(input.temporaryPassword, user.passwordHash);
  if (!ok) {
    const failed = (user.failedLoginAttempts ?? 0) + 1;
    const lockUntil =
      failed >= MAX_FAILED_LOGIN_ATTEMPTS ? new Date(Date.now() + ACCOUNT_LOCK_MINUTES * 60_000) : null;
    await db
      .update(users)
      .set({ failedLoginAttempts: failed, accountLockedUntil: lockUntil })
      .where(eq(users.id, user.id));
    const err = new Error("Invalid temporary password");
    (err as { status?: number }).status = 401;
    throw err;
  }
  if (input.newPassword === input.temporaryPassword) {
    const err = new Error("New password must be different from the temporary password");
    (err as { status?: number }).status = 400;
    throw err;
  }

  const passwordHash = await bcrypt.hash(input.newPassword, BCRYPT_ROUNDS);
  await db
    .update(users)
    .set({
      passwordHash,
      passwordChangeRequired: false,
      temporaryPasswordExpiresAt: null,
      failedLoginAttempts: 0,
      accountLockedUntil: null,
      lastLoginAt: new Date(),
    })
    .where(eq(users.id, user.id));

  await db.delete(authSessions).where(eq(authSessions.userId, user.id));
  const refreshedUser = { id: user.id, organizationId: user.organizationId, email: user.email };
  const { accessToken, refreshToken } = await createSessionTokens(refreshedUser);
  await writeActivityLog({
    organizationId: org.id,
    userId: user.id,
    activityType: "auth.password_setup_completed",
    metadata: { email: user.email },
  });
  return {
    accessToken,
    refreshToken,
    user: { id: user.id, email: user.email, organizationId: org.id },
    organization: { id: org.id, name: org.name, slug: org.slug },
  };
}

export async function refreshTokens(refreshToken: string) {
  const env = getEnv();
  let payload: { sid?: number; sub?: number; typ?: string };
  try {
    payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as {
      sid?: number;
      sub?: number;
      typ?: string;
    };
  } catch {
    const err = new Error("Invalid refresh token");
    (err as { status?: number }).status = 401;
    throw err;
  }
  if (payload.typ !== "refresh" || !payload.sid || !payload.sub) {
    const err = new Error("Invalid refresh token");
    (err as { status?: number }).status = 401;
    throw err;
  }
  const [session] = await db.select().from(authSessions).where(eq(authSessions.id, payload.sid)).limit(1);
  if (!session || session.userId !== payload.sub) {
    const err = new Error("Invalid refresh token");
    (err as { status?: number }).status = 401;
    throw err;
  }
  const expiresAt = session.expiresAt instanceof Date ? session.expiresAt : new Date(session.expiresAt);
  if (expiresAt < new Date()) {
    const err = new Error("Refresh token expired");
    (err as { status?: number }).status = 401;
    throw err;
  }
  if (session.refreshTokenHash !== hashRefreshToken(refreshToken)) {
    const err = new Error("Invalid refresh token");
    (err as { status?: number }).status = 401;
    throw err;
  }

  const [user] = await db.select().from(users).where(eq(users.id, payload.sub)).limit(1);
  if (!user) {
    const err = new Error("Invalid refresh token");
    (err as { status?: number }).status = 401;
    throw err;
  }

  // Rotate session id as well as token hash.
  await db.delete(authSessions).where(eq(authSessions.id, session.id));
  const refreshExpires = new Date();
  const days = parseDurationToDays(env.JWT_REFRESH_EXPIRES_IN) ?? 7;
  refreshExpires.setDate(refreshExpires.getDate() + days);
  await db.insert(authSessions).values({
    userId: user.id,
    refreshTokenHash: "",
    expiresAt: refreshExpires,
  });
  const [newSession] = await db
    .select()
    .from(authSessions)
    .where(eq(authSessions.userId, user.id))
    .orderBy(desc(authSessions.id))
    .limit(1);
  if (!newSession) throw new Error("Failed to rotate session");

  const newRefresh = signRefreshToken(newSession.id, user.id);
  await db
    .update(authSessions)
    .set({ refreshTokenHash: hashRefreshToken(newRefresh) })
    .where(eq(authSessions.id, newSession.id));

  const accessToken = signAccessToken(user);
  return { accessToken, refreshToken: newRefresh };
}

export async function logout(refreshToken: string) {
  try {
    const env = getEnv();
    const payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as { sid?: number };
    if (payload.sid) {
      await db.delete(authSessions).where(eq(authSessions.id, payload.sid));
      await writeActivityLog({ activityType: "auth.logout", metadata: { sid: payload.sid } });
    }
  } catch {
    /* ignore invalid token on logout */
  }
}

export type SessionDetail = {
  user: { id: number; email: string; organizationId: number; phone: string | null; profileImageUrl?: string | null };
  organization: {
    id: number;
    name: string;
    slug: string;
    legalName: string | null;
    email: string | null;
    payableDaysPolicy: string;
    standardWorkdayMinutes: number;
  } | null;
  role: string | null;
  roleAssigned: boolean;
  onboardingCompleted: boolean;
  displayName: string;
  faceRegistered: boolean;
  employeeId: number | null;
};

export async function getSessionDetail(userId: number): Promise<SessionDetail | null> {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return null;
  const [org] = await db.select().from(organizations).where(eq(organizations.id, user.organizationId)).limit(1);
  
  const roleRows = await db
    .select({ roleName: roles.name })
    .from(userRoles)
    .innerJoin(roles, eq(roles.id, userRoles.roleId))
    .where(eq(userRoles.userId, userId));
  const roleName = pickPrimaryRoleName(roleRows.map((r) => r.roleName));
  const onboardingCompleted = Boolean(org?.legalName?.trim());
  const fromProfile = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  const displayName =
    fromProfile ||
    user.email
      .split("@")[0]
      .replace(/[._-]+/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
      
  const [emp] = await db
    .select({ id: employees.id, profileImageUrl: employees.profileImageUrl })
    .from(employees)
    .where(eq(employees.userId, userId))
    .limit(1);

  let faceRegistered = false;
  let employeeId: number | null = null;
  if (emp) {
    employeeId = emp.id;
    const [face] = await db
      .select({ id: employeeFaces.id })
      .from(employeeFaces)
      .where(eq(employeeFaces.employeeId, emp.id))
      .limit(1);
    faceRegistered = !!face;
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      organizationId: user.organizationId,
      phone: user.phone ?? null,
      profileImageUrl: emp?.profileImageUrl ?? null,
    },
    organization: org
      ? {
          id: org.id,
          name: org.name,
          slug: org.slug,
          legalName: org.legalName ?? null,
          email: org.email ?? null,
          payableDaysPolicy: org.payableDaysPolicy,
          standardWorkdayMinutes: org.standardWorkdayMinutes,
        }
      : null,
    role: roleName || null,
    roleAssigned: roleRows.length > 0,
    onboardingCompleted,
    displayName,
    faceRegistered,
    employeeId,
  };
}

export type OnboardingProfileInput = {
  businessName: string;
  stateCode: string;
  stateName: string;
  city: string;
  sectorCode: string;
  sectorName: string;
  subSectorCode: string;
  subSectorName: string;
  employeeCountBand: "lt_20" | "20_100" | "100_500" | "gt_500";
  fullName: string;
  businessEmail: string;
  /** Ten-digit Indian mobile without country code */
  alternatePhone: string;
  alternateContactName: string;
  organizationRole: "owner" | "admin" | "hr" | "others";
};

const ONBOARDING_ROLE_TO_RBAC: Record<OnboardingProfileInput["organizationRole"], string> = {
  owner: "OWNER",
  admin: "ADMIN",
  hr: "HR",
  others: "OTHERS",
};

export async function saveOnboardingProfile(organizationId: number, userId: number, input: OnboardingProfileInput) {
  const code = input.stateCode.trim().toUpperCase();
  if (!INDIAN_STATES.some((s) => s.code === code)) {
    const err = new Error("Invalid state");
    (err as { status?: number }).status = 400;
    throw err;
  }
  const cities = listCitiesForState(code).map((c) => c.toLowerCase());
  if (!cities.includes(input.city.trim().toLowerCase())) {
    const err = new Error("Invalid city for selected state");
    (err as { status?: number }).status = 400;
    throw err;
  }
  const sector = findSector(input.sectorCode);
  if (!sector || sector.name.toLowerCase() !== input.sectorName.trim().toLowerCase()) {
    const err = new Error("Invalid sector");
    (err as { status?: number }).status = 400;
    throw err;
  }
  const sub = sector.subSectors.find((s) => s.code === input.subSectorCode);
  if (!sub || sub.name.toLowerCase() !== input.subSectorName.trim().toLowerCase()) {
    const err = new Error("Invalid sub-sector for sector");
    (err as { status?: number }).status = 400;
    throw err;
  }

  const permMap = await ensureGlobalPermissions();
  const nameParts = input.fullName.trim().split(/\s+/).filter(Boolean);
  const firstName = nameParts[0] ?? "";
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : undefined;
  const phoneStored = `+91${input.alternatePhone}`;
  const rbacName = ONBOARDING_ROLE_TO_RBAC[input.organizationRole];

  await db.transaction(async (tx) => {
    await ensureExtraOrgRoles(tx, organizationId, permMap);

    await tx
      .update(organizations)
      .set({
        legalName: input.businessName.trim(),
        email: input.businessEmail.trim().toLowerCase(),
        regionState: input.stateName.trim(),
        regionCity: input.city.trim(),
        businessSector: input.sectorName.trim(),
        businessSubSector: input.subSectorName.trim(),
        employeeCountBand: input.employeeCountBand,
        alternateContactName: input.alternateContactName.trim(),
      })
      .where(eq(organizations.id, organizationId));

    await tx
      .update(users)
      .set({
        firstName: firstName.trim(),
        lastName: lastName?.trim() || null,
        phone: phoneStored,
      })
      .where(and(eq(users.id, userId), eq(users.organizationId, organizationId)));

    await tx.delete(userRoles).where(eq(userRoles.userId, userId));
    const [targetRole] = await tx
      .select()
      .from(roles)
      .where(and(eq(roles.organizationId, organizationId), eq(roles.name, rbacName)))
      .limit(1);
    if (!targetRole) {
      const err = new Error("Role not found for organization");
      (err as { status?: number }).status = 500;
      throw err;
    }
    await tx.insert(userRoles).values({ userId, roleId: targetRole.id });

    // Create an employee record for the owner so they can use Face Attendance
    const [existingEmp] = await tx.select({ id: employees.id }).from(employees).where(eq(employees.userId, userId)).limit(1);
    if (!existingEmp) {
      await tx.insert(employees).values({
        organizationId,
        userId,
        employeeCode: `EMP-${Date.now().toString().slice(-6)}`,
        firstName: firstName.trim(),
        lastName: lastName?.trim() || null,
        joiningDate: new Date(),
        employmentType: "FULL_TIME",
        status: "active",
        phone: phoneStored,
        workEmail: input.businessEmail.trim().toLowerCase(),
      });
    }
  });

  const [createdEmp] = await db.select({ id: employees.id }).from(employees).where(eq(employees.userId, userId)).limit(1);

  await writeActivityLog({
    organizationId,
    userId,
    activityType: "onboarding.profile_completed",
    metadata: { sector: input.sectorName, role: rbacName },
  });

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (user) {
    void sendOnboardingRoleWelcomeEmail({
      organizationId,
      to: input.businessEmail.trim().toLowerCase(),
      userName: firstName,
      organizationName: input.businessName.trim(),
      role: rbacName,
      loginUrl: `${getEnv().APP_URL}/login`,
    }).catch((e) => console.error("[onboarding] role welcome email failed:", e));
  }

  return { employeeId: createdEmp?.id };
}
