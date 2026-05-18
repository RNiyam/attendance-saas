import { Router } from "express";
import { z } from "zod";
import { authMiddleware, requirePermission, resolvePermissions, type AuthedRequest } from "../../middleware/auth";
import * as integrationsService from "./integrations.service";

const router = Router();

const configSchema = z.object({
  provider: z.string().min(2).max(80),
  status: z.enum(["active", "inactive"]).optional(),
  configJson: z.record(z.string(), z.unknown()).optional(),
  webhookSecret: z.string().max(128).optional(),
});

const dispatchSchema = z.object({
  provider: z.string().min(2).max(80),
  endpointUrl: z.string().url(),
  payload: z.record(z.string(), z.unknown()),
});

router.use(authMiddleware, resolvePermissions, requirePermission("MANAGE_INTEGRATIONS"));

router.get("/configs", async (req: AuthedRequest, res, next) => {
  try {
    const data = await integrationsService.listIntegrationConfigs(req.user!.organizationId);
    res.json(data);
  } catch (e) {
    next(e);
  }
});

router.post("/configs", async (req: AuthedRequest, res, next) => {
  try {
    const body = configSchema.parse(req.body);
    await integrationsService.upsertIntegrationConfig({
      organizationId: req.user!.organizationId,
      ...body,
    });
    res.status(201).json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.post("/dispatch-webhook", async (req: AuthedRequest, res, next) => {
  try {
    const body = dispatchSchema.parse(req.body);
    const result = await integrationsService.dispatchWebhook({
      organizationId: req.user!.organizationId,
      ...body,
    });
    res.json(result);
  } catch (e) {
    next(e);
  }
});

export { router as integrationsRouter };
