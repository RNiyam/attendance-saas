import { Router } from "express";
import { z } from "zod";
import { authMiddleware, requirePermission, resolvePermissions, type AuthedRequest } from "../../middleware/auth";
import * as smtpSettings from "./smtp-settings.service";

const router = Router();

const upsertSchema = z.object({
  host: z.string().min(1).max(255),
  port: z.coerce.number().int().min(1).max(65535),
  secure: z.boolean(),
  username: z.string().min(1).max(255),
  password: z.string().min(1).max(512).optional().or(z.literal("")),
  fromEmail: z.string().email(),
  fromName: z.string().min(1).max(255),
  isActive: z.boolean().optional(),
});

const testInlineSchema = z.object({
  mode: z.literal("inline"),
  host: z.string().min(1),
  port: z.coerce.number().int().min(1).max(65535),
  secure: z.boolean(),
  username: z.string().min(1),
  password: z.string().min(1),
  fromEmail: z.string().email(),
  fromName: z.string().min(1).max(255),
  testRecipientEmail: z.string().email().optional(),
});

const testSavedSchema = z.object({
  mode: z.literal("saved"),
  testRecipientEmail: z.string().email().optional(),
});

const testBodySchema = z.discriminatedUnion("mode", [testSavedSchema, testInlineSchema]);

const patchActiveSchema = z.object({
  isActive: z.boolean(),
});

router.use(authMiddleware, resolvePermissions);

router.get("/smtp", requirePermission("MANAGE_INTEGRATIONS"), async (req: AuthedRequest, res, next) => {
  try {
    const data = await smtpSettings.getOrganizationSmtpPublic(req.user!.organizationId);
    res.json(data);
  } catch (e) {
    next(e);
  }
});

router.put("/smtp", requirePermission("MANAGE_INTEGRATIONS"), async (req: AuthedRequest, res, next) => {
  try {
    const body = upsertSchema.parse(req.body);
    await smtpSettings.upsertOrganizationSmtp(req.user!.organizationId, {
      host: body.host,
      port: body.port,
      secure: body.secure,
      username: body.username,
      password: body.password?.trim() || undefined,
      fromEmail: body.fromEmail,
      fromName: body.fromName,
      isActive: body.isActive,
    });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.patch("/smtp", requirePermission("MANAGE_INTEGRATIONS"), async (req: AuthedRequest, res, next) => {
  try {
    const body = patchActiveSchema.parse(req.body);
    await smtpSettings.patchOrganizationSmtpActive(req.user!.organizationId, body.isActive);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.post("/smtp/test", requirePermission("MANAGE_INTEGRATIONS"), async (req: AuthedRequest, res, next) => {
  try {
    const body = testBodySchema.parse(req.body);
    const result =
      body.mode === "saved"
        ? await smtpSettings.testSavedOrganizationSmtp(req.user!.organizationId, body.testRecipientEmail)
        : await smtpSettings.testSmtpInline({
            host: body.host,
            port: body.port,
            secure: body.secure,
            username: body.username,
            password: body.password,
            fromEmail: body.fromEmail,
            fromName: body.fromName,
            testRecipientEmail: body.testRecipientEmail,
          });
    res.json(result);
  } catch (e) {
    next(e);
  }
});

export { router as settingsRouter };
