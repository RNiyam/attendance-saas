import { Router } from "express";
import { z } from "zod";
import { authMiddleware, resolvePermissions, type AuthedRequest } from "../../middleware/auth";
import * as authService from "./auth.service";

const router = Router();

const signupSchema = z.object({
  organizationName: z.string().min(2).max(255),
  organizationSlug: z
    .string()
    .trim()
    .transform((value) => value.toUpperCase())
    .pipe(z.string().regex(/^[A-Z]{4}\d{4}$/, "Organization code must be 4 letters followed by 4 numbers"))
    .optional(),
  ownerEmail: z.string().email(),
  ownerDisplayName: z.string().max(255).optional(),
  appLoginUrl: z.string().url().optional(),
});

const organizationCodePreviewSchema = z.object({
  organizationName: z.string().min(2).max(255),
});

const passwordSchema = z
  .string()
  .min(8)
  .max(128)
  .refine((value) => {
    const checks = [
      /[a-z]/.test(value),
      /[A-Z]/.test(value),
      /[0-9]/.test(value),
      /[^A-Za-z0-9]/.test(value),
    ];
    return checks.filter(Boolean).length >= 3;
  }, "Password must contain at least three of: lowercase, uppercase, number, special character");

const loginSchema = z.object({
  organizationSlug: z.string().trim().min(1),
  email: z.string().email(),
  password: z.string().min(1),
});

const completePasswordSetupSchema = z.object({
  organizationSlug: z.string().trim().min(1),
  email: z.string().email(),
  temporaryPassword: z.string().min(1),
  newPassword: passwordSchema,
});

const refreshSchema = z.object({
  refreshToken: z.string().min(10),
});

router.post("/signup", async (req, res, next) => {
  try {
    const body = signupSchema.parse(req.body);
    const result = await authService.signup(body);
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
});

router.post("/organization-code-preview", async (req, res, next) => {
  try {
    const body = organizationCodePreviewSchema.parse(req.body);
    const result = await authService.previewOrganizationCode(body.organizationName);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const body = loginSchema.parse(req.body);
    const result = await authService.login(body);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.post("/complete-password-setup", async (req, res, next) => {
  try {
    const body = completePasswordSetupSchema.parse(req.body);
    const result = await authService.completePasswordSetup(body);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.post("/refresh", async (req, res, next) => {
  try {
    const body = refreshSchema.parse(req.body);
    const result = await authService.refreshTokens(body.refreshToken);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.post("/logout", async (req, res, next) => {
  try {
    const body = refreshSchema.parse(req.body);
    await authService.logout(body.refreshToken);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

router.get("/me", authMiddleware, resolvePermissions, async (req: AuthedRequest, res, next) => {
  try {
    const detail = await authService.getSessionDetail(req.user!.id);
    if (!detail) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json({
      ...detail,
      permissions: req.user!.permissions,
    });
  } catch (e) {
    next(e);
  }
});

export { router as authRouter };
