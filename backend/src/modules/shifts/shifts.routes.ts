import { Router } from "express";
import { z } from "zod";
import { authMiddleware, requirePermission, resolvePermissions, type AuthedRequest } from "../../middleware/auth";
import * as shiftsService from "./shifts.service";

const router = Router();

const timeLike = z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/);

const shiftBreakSchema = z.object({
  category: z.enum(["shift_break", "casual_break"]),
  breakName: z.string().trim().max(120).optional().nullable(),
  payType: z.enum(["paid", "unpaid"]),
  ruleType: z.enum(["interval", "duration"]),
  durationMinutes: z.number().int().positive().max(1440).optional().nullable(),
  startTime: timeLike.optional().nullable(),
  endTime: timeLike.optional().nullable(),
  bufferStartTime: timeLike.optional().nullable(),
  bufferEndTime: timeLike.optional().nullable(),
});

const shiftSchema = z.object({
  name: z.string().min(2).max(120),
  shiftCode: z.string().max(40).optional().nullable(),
  shiftType: z.enum(["fixed", "flexible", "open", "rotational"]).optional(),
  startTime: z.string().min(4),
  endTime: z.string().min(4),
  earliestPunchIn: timeLike.optional().nullable(),
  latestPunchOut: timeLike.optional().nullable(),
  branchId: z.number().int().positive().optional(),
  gracePeriodMinutes: z.number().int().nonnegative().optional(),
  overtimeEnabled: z.number().int().min(0).max(1).optional(),
  lateMarkEnabled: z.number().int().min(0).max(1).optional(),
  weeklyOffPolicy: z.string().max(120).optional(),
  breakPolicy: z.string().max(4000).optional().nullable(),
  breaks: z.array(shiftBreakSchema).max(20).optional(),
});

const assignmentSchema = z.object({
  employeeId: z.number().int().positive(),
  shiftId: z.number().int().positive(),
  effectiveFrom: z.string().min(8),
  effectiveTo: z.string().min(8).optional(),
  isTemporary: z.number().int().min(0).max(1).optional(),
});

const holidaySchema = z.object({
  name: z.string().min(2).max(150),
  holidayDate: z.string().min(8),
  branchId: z.number().int().positive().optional(),
});

const holidayTemplateSchema = z.object({
  name: z.string().trim().min(2).max(150),
  startDate: z.string().min(8),
  endDate: z.string().min(8),
  holidays: z
    .array(
      z.object({
        holidayName: z.string().trim().min(2).max(150),
        holidayDate: z.string().min(8),
      }),
    )
    .max(100)
    .default([]),
});

const policySchema = z.object({
  name: z.string().min(2).max(120),
  lateAfterMinutes: z.number().int().nonnegative().optional(),
  halfDayAfterMinutes: z.number().int().nonnegative().optional(),
  overtimeAfterMinutes: z.number().int().nonnegative().optional(),
  weeklyOffDays: z.string().max(64).optional(),
});

const validationSchema = z.object({
  employeeId: z.number().int().positive(),
  date: z.string().min(8),
});

router.use(authMiddleware, resolvePermissions);

/** Master list for setup dropdowns — any authenticated org user may read. */
router.get("/shift-types", async (_req: AuthedRequest, res, next) => {
  try {
    const data = await shiftsService.listShiftTypeMasters();
    res.json(data);
  } catch (e) {
    next(e);
  }
});

router.get("/", requirePermission("VIEW_SHIFTS"), async (req: AuthedRequest, res, next) => {
  try {
    const data = await shiftsService.listShifts(req.user!.organizationId);
    res.json(data);
  } catch (e) {
    next(e);
  }
});

router.get("/holiday-templates", requirePermission("VIEW_SHIFTS"), async (req: AuthedRequest, res, next) => {
  try {
    const data = await shiftsService.listHolidayTemplates(req.user!.organizationId);
    res.json(data);
  } catch (e) {
    next(e);
  }
});

router.post("/holiday-templates", requirePermission("MANAGE_SHIFTS"), async (req: AuthedRequest, res, next) => {
  try {
    const body = holidayTemplateSchema.parse(req.body);
    const data = await shiftsService.createHolidayTemplate({
      organizationId: req.user!.organizationId,
      ...body,
    });
    res.status(201).json(data);
  } catch (e) {
    next(e);
  }
});

const holidayTemplateIdParam = z.coerce.number().int().positive();

router.get("/holiday-templates/:templateId", requirePermission("VIEW_SHIFTS"), async (req: AuthedRequest, res, next) => {
  try {
    const templateId = holidayTemplateIdParam.parse(req.params.templateId);
    const data = await shiftsService.getHolidayTemplate(req.user!.organizationId, templateId);
    if (!data) {
      res.status(404).json({ error: "Holiday template not found" });
      return;
    }
    res.json(data);
  } catch (e) {
    next(e);
  }
});

router.put("/holiday-templates/:templateId", requirePermission("MANAGE_SHIFTS"), async (req: AuthedRequest, res, next) => {
  try {
    const templateId = holidayTemplateIdParam.parse(req.params.templateId);
    const body = holidayTemplateSchema.parse(req.body);
    const data = await shiftsService.updateHolidayTemplate({
      organizationId: req.user!.organizationId,
      templateId,
      ...body,
    });
    if (!data) {
      res.status(404).json({ error: "Holiday template not found" });
      return;
    }
    res.json(data);
  } catch (e) {
    next(e);
  }
});

router.delete("/holiday-templates/:templateId", requirePermission("MANAGE_SHIFTS"), async (req: AuthedRequest, res, next) => {
  try {
    const templateId = holidayTemplateIdParam.parse(req.params.templateId);
    const ok = await shiftsService.deleteHolidayTemplate(req.user!.organizationId, templateId);
    if (!ok) {
      res.status(404).json({ error: "Holiday template not found" });
      return;
    }
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.post(
  "/holiday-templates/:templateId/clone",
  requirePermission("MANAGE_SHIFTS"),
  async (req: AuthedRequest, res, next) => {
    try {
      const templateId = holidayTemplateIdParam.parse(req.params.templateId);
      const data = await shiftsService.cloneHolidayTemplate(req.user!.organizationId, templateId);
      if (!data) {
        res.status(404).json({ error: "Holiday template not found" });
        return;
      }
      res.status(201).json(data);
    } catch (e) {
      next(e);
    }
  },
);

router.get("/:id", requirePermission("VIEW_SHIFTS"), async (req: AuthedRequest, res, next) => {
  try {
    const shiftId = z.coerce.number().int().positive().parse(req.params.id);
    const data = await shiftsService.getShift(req.user!.organizationId, shiftId);
    if (!data) {
      res.status(404).json({ error: "Shift not found" });
      return;
    }
    res.json(data);
  } catch (e) {
    next(e);
  }
});

router.post("/", requirePermission("MANAGE_SHIFTS"), async (req: AuthedRequest, res, next) => {
  try {
    const body = shiftSchema.parse(req.body);
    const data = await shiftsService.createShift({ organizationId: req.user!.organizationId, ...body });
    res.status(201).json(data);
  } catch (e) {
    next(e);
  }
});

router.patch("/:id", requirePermission("MANAGE_SHIFTS"), async (req: AuthedRequest, res, next) => {
  try {
    const shiftId = z.coerce.number().int().positive().parse(req.params.id);
    const body = shiftSchema.parse(req.body);
    const data = await shiftsService.updateShift({ organizationId: req.user!.organizationId, shiftId, ...body });
    if (!data) {
      res.status(404).json({ error: "Shift not found" });
      return;
    }
    res.json(data);
  } catch (e) {
    next(e);
  }
});

router.post("/assignments", requirePermission("ASSIGN_SHIFTS"), async (req: AuthedRequest, res, next) => {
  try {
    const body = assignmentSchema.parse(req.body);
    const data = await shiftsService.assignShift({ organizationId: req.user!.organizationId, ...body });
    res.status(201).json(data);
  } catch (e) {
    next(e);
  }
});

router.get("/holidays", requirePermission("VIEW_SHIFTS"), async (req: AuthedRequest, res, next) => {
  try {
    const data = await shiftsService.listHolidays(req.user!.organizationId);
    res.json(data);
  } catch (e) {
    next(e);
  }
});

router.post("/holidays", requirePermission("MANAGE_SHIFTS"), async (req: AuthedRequest, res, next) => {
  try {
    const body = holidaySchema.parse(req.body);
    await shiftsService.createHoliday({ organizationId: req.user!.organizationId, ...body });
    res.status(201).json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.get("/policies", requirePermission("VIEW_SHIFTS"), async (req: AuthedRequest, res, next) => {
  try {
    const data = await shiftsService.listAttendancePolicies(req.user!.organizationId);
    res.json(data);
  } catch (e) {
    next(e);
  }
});

router.post("/policies", requirePermission("MANAGE_SHIFTS"), async (req: AuthedRequest, res, next) => {
  try {
    const body = policySchema.parse(req.body);
    await shiftsService.createAttendancePolicy({ organizationId: req.user!.organizationId, ...body });
    res.status(201).json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.post("/validate-context", requirePermission("VIEW_SHIFTS"), async (req: AuthedRequest, res, next) => {
  try {
    const body = validationSchema.parse(req.body);
    const result = await shiftsService.validateEmployeeShiftContext({
      organizationId: req.user!.organizationId,
      ...body,
    });
    res.json(result);
  } catch (e) {
    next(e);
  }
});

export { router as shiftsRouter };
