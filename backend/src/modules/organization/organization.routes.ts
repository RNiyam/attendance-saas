import { Router } from "express";
import { z } from "zod";
import * as authService from "../auth/auth.service";
import { authMiddleware, requirePermission, resolvePermissions, type AuthedRequest } from "../../middleware/auth";
import * as organizationService from "./organization.service";

const router = Router();

const branchSchema = z.object({
  name: z.string().min(2).max(150),
  address: z.string().max(500).optional(),
  timezone: z.string().max(64).optional(),
});

const departmentSchema = z.object({
  name: z.string().min(2).max(150),
  description: z.string().max(512).optional(),
  branchId: z.number().int().positive().optional(),
});

const designationSchema = z.object({
  title: z.string().min(2).max(150),
  level: z.string().max(64).optional(),
});

const businessFunctionTypeSchema = z.enum(["departments", "designations", "shifts"]);
const businessFunctionValueIdSchema = z.coerce.number().int().positive();

const businessFunctionValueSchema = z.object({
  name: z.string().trim().min(2).max(150),
  startTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).optional(),
});

const onboardingProfileSchema = z.object({
  businessName: z.string().min(2).max(255),
  stateCode: z.string().min(2).max(3),
  stateName: z.string().min(2).max(120),
  city: z.string().min(1).max(150),
  sectorCode: z.string().min(1).max(80),
  sectorName: z.string().min(1).max(128),
  subSectorCode: z.string().min(1).max(80),
  subSectorName: z.string().min(1).max(128),
  employeeCountBand: z.enum(["lt_20", "20_100", "100_500", "gt_500"]),
  fullName: z.string().min(2).max(200),
  businessEmail: z.string().email().max(255),
  alternatePhone: z.string().regex(/^\d{10}$/),
  alternateContactName: z.string().min(2).max(150),
  organizationRole: z.enum(["owner", "admin", "hr", "others"]),
});

const payrollDefaultsSchema = z
  .object({
    payableDaysPolicy: z.enum([
      "calendar_month",
      "fixed_30",
      "fixed_28",
      "fixed_26",
      "exclude_weekly_offs",
    ]),
    standardWorkHours: z.number().int().min(0).max(23),
    standardWorkMins: z.number().int().min(0).max(59),
  })
  .refine((d) => d.standardWorkHours * 60 + d.standardWorkMins > 0, {
    message: "Standard work hours must be greater than zero",
    path: ["standardWorkHours"],
  })
  .refine((d) => d.standardWorkHours * 60 + d.standardWorkMins <= 24 * 60, {
    message: "Standard work hours cannot exceed 24 hours per day",
    path: ["standardWorkHours"],
  });

router.use(authMiddleware, resolvePermissions);

router.patch("/payroll-defaults", async (req: AuthedRequest, res, next) => {
  try {
    const body = payrollDefaultsSchema.parse(req.body);
    const minutes = body.standardWorkHours * 60 + body.standardWorkMins;
    await organizationService.updateOrganizationPayrollDefaults(req.user!.organizationId, {
      payableDaysPolicy: body.payableDaysPolicy,
      standardWorkdayMinutes: minutes,
    });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.patch("/onboarding", async (req: AuthedRequest, res, next) => {
  try {
    const body = onboardingProfileSchema.parse(req.body);
    await authService.saveOnboardingProfile(req.user!.organizationId, req.user!.id, body);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.get("/business-functions", async (req: AuthedRequest, res, next) => {
  try {
    const data = await organizationService.listBusinessFunctions(req.user!.organizationId);
    res.json(data);
  } catch (e) {
    next(e);
  }
});

router.post("/business-functions/skip", async (req: AuthedRequest, res, next) => {
  try {
    const department = await organizationService.ensureOrganizationOnlyDepartment(req.user!.organizationId);
    res.json({ ok: true, department });
  } catch (e) {
    next(e);
  }
});

router.delete("/business-functions/:type/values/:id", async (req: AuthedRequest, res, next) => {
  try {
    const type = businessFunctionTypeSchema.parse(req.params.type);
    const id = businessFunctionValueIdSchema.parse(req.params.id);
    const deleted = await organizationService.deleteBusinessFunctionValue(req.user!.organizationId, type, id);
    if (!deleted) {
      res.status(404).json({ error: "Business function value not found" });
      return;
    }
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.post("/business-functions/:type/values", async (req: AuthedRequest, res, next) => {
  try {
    const type = businessFunctionTypeSchema.parse(req.params.type);
    const body = businessFunctionValueSchema.parse(req.body);
    const data = await organizationService.createBusinessFunctionValue(req.user!.organizationId, type, {
      ...body,
      startTime: body.startTime?.length === 5 ? `${body.startTime}:00` : body.startTime,
      endTime: body.endTime?.length === 5 ? `${body.endTime}:00` : body.endTime,
    });
    res.status(201).json(data);
  } catch (e) {
    next(e);
  }
});

router.get("/branches", requirePermission("MANAGE_BRANCHES"), async (req: AuthedRequest, res, next) => {
  try {
    const data = await organizationService.listBranches(req.user!.organizationId);
    res.json(data);
  } catch (e) {
    next(e);
  }
});

router.post("/branches", requirePermission("MANAGE_BRANCHES"), async (req: AuthedRequest, res, next) => {
  try {
    const body = branchSchema.parse(req.body);
    const data = await organizationService.createBranch({ organizationId: req.user!.organizationId, ...body });
    res.status(201).json(data);
  } catch (e) {
    next(e);
  }
});

router.get("/departments", requirePermission("MANAGE_DEPARTMENTS"), async (req: AuthedRequest, res, next) => {
  try {
    const data = await organizationService.listDepartments(req.user!.organizationId);
    res.json(data);
  } catch (e) {
    next(e);
  }
});

router.post("/departments", requirePermission("MANAGE_DEPARTMENTS"), async (req: AuthedRequest, res, next) => {
  try {
    const body = departmentSchema.parse(req.body);
    const data = await organizationService.createDepartment({
      organizationId: req.user!.organizationId,
      ...body,
    });
    res.status(201).json(data);
  } catch (e) {
    next(e);
  }
});

router.get("/designations", requirePermission("MANAGE_DESIGNATIONS"), async (req: AuthedRequest, res, next) => {
  try {
    const data = await organizationService.listDesignations(req.user!.organizationId);
    res.json(data);
  } catch (e) {
    next(e);
  }
});

router.post("/designations", requirePermission("MANAGE_DESIGNATIONS"), async (req: AuthedRequest, res, next) => {
  try {
    const body = designationSchema.parse(req.body);
    const data = await organizationService.createDesignation({
      organizationId: req.user!.organizationId,
      ...body,
    });
    res.status(201).json(data);
  } catch (e) {
    next(e);
  }
});

export { router as organizationRouter };
