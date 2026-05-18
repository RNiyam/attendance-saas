import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { getEnv } from "../../config/env";
import { db } from "../../database";
import { platformAdmins } from "../../database/schema";

const BCRYPT_ROUNDS = 12;

function signPlatformAccessToken(admin: { id: number; email: string }): string {
  const env = getEnv();
  return jwt.sign(
    { sub: admin.id, email: admin.email, typ: "platform_access" },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions["expiresIn"] },
  );
}

export async function ensureDefaultPlatformAdmin(): Promise<void> {
  const email = process.env.PLATFORM_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.PLATFORM_ADMIN_PASSWORD?.trim();
  if (!email || !password) return;

  const [existing] = await db.select().from(platformAdmins).where(eq(platformAdmins.email, email)).limit(1);
  if (existing) return;

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  await db.insert(platformAdmins).values({
    email,
    passwordHash,
    displayName: "Platform Admin",
    status: "active",
  });
}

export async function loginPlatformAdmin(email: string, password: string) {
  const normalized = email.trim().toLowerCase();
  const [admin] = await db
    .select()
    .from(platformAdmins)
    .where(eq(platformAdmins.email, normalized))
    .limit(1);
  if (!admin || admin.status !== "active") {
    const err = new Error("Invalid email or password");
    (err as { status?: number }).status = 401;
    throw err;
  }
  const ok = await bcrypt.compare(password, admin.passwordHash);
  if (!ok) {
    const err = new Error("Invalid email or password");
    (err as { status?: number }).status = 401;
    throw err;
  }
  const accessToken = signPlatformAccessToken({ id: admin.id, email: admin.email });
  return {
    accessToken,
    admin: { id: admin.id, email: admin.email, displayName: admin.displayName },
  };
}

export async function getPlatformAdminById(id: number) {
  const [admin] = await db.select().from(platformAdmins).where(eq(platformAdmins.id, id)).limit(1);
  if (!admin || admin.status !== "active") return null;
  return { id: admin.id, email: admin.email, displayName: admin.displayName };
}
