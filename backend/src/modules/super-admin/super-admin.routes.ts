import { Router } from "express";
import { z } from "zod";
import { getEnv } from "../../config/env";
import { platformAdminAuth, type PlatformAdminRequest } from "../../middleware/platform-admin-auth";
import { superAdminAuth } from "../../middleware/super-admin";
import { smtpConfigured, verifySmtpConnection } from "../email/smtp.service";
import * as masters from "./masters.service";
import * as platformAdmin from "./platform-admin.service";

const router = Router();

function maskHost(host: string | undefined): string | null {
  if (!host) return null;
  if (host.length <= 4) return `${host[0]}***`;
  return `${host.slice(0, 3)}…${host.slice(-2)}`;
}

// —— Auth (public) ——
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post("/auth/login", async (req, res, next) => {
  try {
    const body = loginSchema.parse(req.body);
    const result = await platformAdmin.loginPlatformAdmin(body.email, body.password);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.get("/auth/me", platformAdminAuth, async (req: PlatformAdminRequest, res, next) => {
  try {
    const admin = await platformAdmin.getPlatformAdminById(req.platformAdmin!.id);
    if (!admin) {
      res.status(404).json({ error: "Admin not found" });
      return;
    }
    res.json({ admin });
  } catch (e) {
    next(e);
  }
});

// —— Platform ops (API key OR platform JWT) ——
function platformOpsAuth(req: PlatformAdminRequest, res: import("express").Response, next: import("express").NextFunction) {
  const key = req.header("x-super-admin-key");
  const expected = getEnv().SUPER_ADMIN_API_KEY;
  if (key && expected && key === expected) {
    next();
    return;
  }
  return platformAdminAuth(req, res, next);
}

router.get("/platform/smtp-status", platformOpsAuth, (_req, res) => {
  const e = getEnv();
  const smtpOk = Boolean(e.SMTP_HOST && e.SMTP_PORT && e.SMTP_USER && e.SMTP_PASS && e.SMTP_FROM);
  res.json({
    smtpConfigured: smtpOk,
    smtpHostHint: maskHost(e.SMTP_HOST),
    smtpFromConfigured: Boolean(e.SMTP_FROM),
    redisConfigured: Boolean(e.REDIS_URL),
    orgSmtpEncryptionConfigured: Boolean(e.SMTP_SECRETS_ENCRYPTION_KEY && e.SMTP_SECRETS_ENCRYPTION_KEY.length >= 16),
  });
});

router.post("/platform/smtp-verify", platformOpsAuth, async (_req, res, next) => {
  try {
    if (!smtpConfigured()) {
      res.status(400).json({ error: "Platform SMTP is not fully configured in environment variables." });
      return;
    }
    await verifySmtpConnection();
    res.json({ ok: true, message: "Platform SMTP credentials verified." });
  } catch (e) {
    next(e);
  }
});

// Legacy API-key-only routes
router.get("/platform/smtp-status-legacy", superAdminAuth, (_req, res) => {
  const e = getEnv();
  res.json({ smtpConfigured: Boolean(e.SMTP_HOST && e.SMTP_FROM) });
});

// —— Masters (platform admin JWT) ——
router.use(platformAdminAuth);

router.get("/organizations", async (_req, res, next) => {
  try {
    res.json(await masters.listOrganizations());
  } catch (e) {
    next(e);
  }
});

router.get("/masters/permissions", async (_req, res, next) => {
  try {
    res.json(await masters.listPermissions());
  } catch (e) {
    next(e);
  }
});

router.get("/masters/shift-types", async (_req, res, next) => {
  try {
    res.json(await masters.listShiftTypesAdmin());
  } catch (e) {
    next(e);
  }
});

router.post("/masters/shift-types", async (req, res, next) => {
  try {
    const body = z
      .object({
        code: z.string().min(1).max(32),
        label: z.string().min(1).max(120),
        description: z.string().max(255).optional(),
        sortOrder: z.number().int().optional(),
      })
      .parse(req.body);
    res.status(201).json(await masters.createShiftType(body));
  } catch (e) {
    next(e);
  }
});

router.patch("/masters/shift-types/:id", async (req, res, next) => {
  try {
    const id = z.coerce.number().int().positive().parse(req.params.id);
    const body = z
      .object({
        label: z.string().min(1).max(120).optional(),
        description: z.string().max(255).optional(),
        sortOrder: z.number().int().optional(),
      })
      .parse(req.body);
    const row = await masters.updateShiftType(id, body);
    if (!row) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(row);
  } catch (e) {
    next(e);
  }
});

router.delete("/masters/shift-types/:id", async (req, res, next) => {
  try {
    const id = z.coerce.number().int().positive().parse(req.params.id);
    await masters.deleteShiftType(id);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

router.get("/masters/states", async (_req, res, next) => {
  try {
    res.json(await masters.listStatesAdmin());
  } catch (e) {
    next(e);
  }
});

router.post("/masters/states", async (req, res, next) => {
  try {
    const body = z
      .object({
        code: z.string().min(2).max(8),
        name: z.string().min(1).max(120),
        sortOrder: z.number().int().optional(),
        isActive: z.boolean().optional(),
      })
      .parse(req.body);
    res.status(201).json(await masters.createState(body));
  } catch (e) {
    next(e);
  }
});

router.patch("/masters/states/:id", async (req, res, next) => {
  try {
    const id = z.coerce.number().int().positive().parse(req.params.id);
    const body = z
      .object({
        name: z.string().min(1).max(120).optional(),
        sortOrder: z.number().int().optional(),
        isActive: z.boolean().optional(),
      })
      .parse(req.body);
    const row = await masters.updateState(id, body);
    if (!row) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(row);
  } catch (e) {
    next(e);
  }
});

router.get("/masters/cities", async (req, res, next) => {
  try {
    const stateId = req.query.stateId ? z.coerce.number().int().positive().parse(req.query.stateId) : undefined;
    res.json(await masters.listCitiesAdmin(stateId));
  } catch (e) {
    next(e);
  }
});

router.post("/masters/cities", async (req, res, next) => {
  try {
    const body = z
      .object({
        stateId: z.number().int().positive(),
        name: z.string().min(1).max(150),
        sortOrder: z.number().int().optional(),
        isActive: z.boolean().optional(),
      })
      .parse(req.body);
    res.status(201).json(await masters.createCity(body));
  } catch (e) {
    next(e);
  }
});

router.patch("/masters/cities/:id", async (req, res, next) => {
  try {
    const id = z.coerce.number().int().positive().parse(req.params.id);
    const body = z
      .object({
        name: z.string().min(1).max(150).optional(),
        sortOrder: z.number().int().optional(),
        isActive: z.boolean().optional(),
      })
      .parse(req.body);
    const row = await masters.updateCity(id, body);
    if (!row) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(row);
  } catch (e) {
    next(e);
  }
});

router.delete("/masters/cities/:id", async (req, res, next) => {
  try {
    const id = z.coerce.number().int().positive().parse(req.params.id);
    await masters.deleteCity(id);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

router.get("/masters/sectors", async (_req, res, next) => {
  try {
    res.json(await masters.listSectorsAdmin());
  } catch (e) {
    next(e);
  }
});

router.post("/masters/sectors", async (req, res, next) => {
  try {
    const body = z
      .object({
        code: z.string().min(1).max(80),
        name: z.string().min(1).max(128),
        sortOrder: z.number().int().optional(),
        isActive: z.boolean().optional(),
      })
      .parse(req.body);
    res.status(201).json(await masters.createSector(body));
  } catch (e) {
    next(e);
  }
});

router.patch("/masters/sectors/:id", async (req, res, next) => {
  try {
    const id = z.coerce.number().int().positive().parse(req.params.id);
    const body = z
      .object({
        name: z.string().min(1).max(128).optional(),
        sortOrder: z.number().int().optional(),
        isActive: z.boolean().optional(),
      })
      .parse(req.body);
    const row = await masters.updateSector(id, body);
    if (!row) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(row);
  } catch (e) {
    next(e);
  }
});

router.get("/masters/sub-sectors", async (req, res, next) => {
  try {
    const sectorId = req.query.sectorId ? z.coerce.number().int().positive().parse(req.query.sectorId) : undefined;
    res.json(await masters.listSubSectorsAdmin(sectorId));
  } catch (e) {
    next(e);
  }
});

router.post("/masters/sub-sectors", async (req, res, next) => {
  try {
    const body = z
      .object({
        sectorId: z.number().int().positive(),
        code: z.string().min(1).max(80),
        name: z.string().min(1).max(128),
        sortOrder: z.number().int().optional(),
        isActive: z.boolean().optional(),
      })
      .parse(req.body);
    res.status(201).json(await masters.createSubSector(body));
  } catch (e) {
    next(e);
  }
});

router.patch("/masters/sub-sectors/:id", async (req, res, next) => {
  try {
    const id = z.coerce.number().int().positive().parse(req.params.id);
    const body = z
      .object({
        name: z.string().min(1).max(128).optional(),
        sortOrder: z.number().int().optional(),
        isActive: z.boolean().optional(),
      })
      .parse(req.body);
    const row = await masters.updateSubSector(id, body);
    if (!row) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(row);
  } catch (e) {
    next(e);
  }
});

router.delete("/masters/sub-sectors/:id", async (req, res, next) => {
  try {
    const id = z.coerce.number().int().positive().parse(req.params.id);
    await masters.deleteSubSector(id);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

router.get("/masters/enums", async (req, res, next) => {
  try {
    const enumType = req.query.type ? String(req.query.type) : undefined;
    res.json(await masters.listEnumMasters(enumType));
  } catch (e) {
    next(e);
  }
});

router.post("/masters/enums", async (req, res, next) => {
  try {
    const body = z
      .object({
        enumType: z.string().min(1).max(64),
        code: z.string().min(1).max(64),
        label: z.string().min(1).max(150),
        sortOrder: z.number().int().optional(),
        isActive: z.boolean().optional(),
      })
      .parse(req.body);
    res.status(201).json(await masters.createEnumMaster(body));
  } catch (e) {
    next(e);
  }
});

router.patch("/masters/enums/:id", async (req, res, next) => {
  try {
    const id = z.coerce.number().int().positive().parse(req.params.id);
    const body = z
      .object({
        label: z.string().min(1).max(150).optional(),
        sortOrder: z.number().int().optional(),
        isActive: z.boolean().optional(),
      })
      .parse(req.body);
    const row = await masters.updateEnumMaster(id, body);
    if (!row) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(row);
  } catch (e) {
    next(e);
  }
});

router.delete("/masters/enums/:id", async (req, res, next) => {
  try {
    const id = z.coerce.number().int().positive().parse(req.params.id);
    await masters.deleteEnumMaster(id);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

export { router as superAdminRouter };
