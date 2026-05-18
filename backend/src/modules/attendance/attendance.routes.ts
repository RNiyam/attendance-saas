import { Router } from "express";
import { z } from "zod";
import { authMiddleware, requirePermission, requireSaveDefaultAttendanceTemplate, resolvePermissions, type AuthedRequest } from "../../middleware/auth";
import * as attendanceService from "./attendance.service";

const router = Router();

router.use((_req, res, next) => {
  res.set("Cache-Control", "no-store, private");
  next();
});

const checkInSchema = z.object({
  employeeId: z.number().int().positive(),
  source: z.enum(["mobile", "biometric", "face", "qr", "manual"]).optional(),
});

const checkOutSchema = z.object({
  employeeId: z.number().int().positive(),
});

const breakSchema = z.object({
  employeeId: z.number().int().positive(),
  shiftBreakId: z.number().int().positive().optional(),
});

const adjustmentSchema = z.object({
  recordId: z.number().int().positive(),
  reason: z.string().min(5).max(300),
  newCheckIn: z.string().optional(),
  newCheckOut: z.string().optional(),
});

const templateSchema = z.object({
  name: z.string().trim().min(2).max(120),
  attendanceMode: z.string().trim().min(1).max(80).optional(),
  holidayAttendance: z.string().trim().min(1).max(80).optional(),
  trackInOutTime: z.boolean().optional(),
  noAttendanceWithoutPunchOut: z.boolean().optional(),
  allowMultiplePunches: z.boolean().optional(),
  autoApproveAttendance: z.boolean().optional(),
  autoApproveAfterDays: z.string().trim().min(1).max(8).optional(),
  markAbsentPreviousDays: z.boolean().optional(),
  effectiveWorkingHourRule: z.string().trim().min(1).max(80).optional(),
  lateAfterMinutes: z.number().int().nonnegative().optional(),
  halfDayAfterMinutes: z.number().int().nonnegative().optional(),
  overtimeAfterMinutes: z.number().int().nonnegative().optional(),
  weeklyOffDays: z.string().trim().max(64).optional(),
});

router.use(authMiddleware, resolvePermissions);

router.get("/templates", requirePermission("VIEW_ATTENDANCE"), async (req: AuthedRequest, res, next) => {
  try {
    const data = await attendanceService.listAttendanceTemplates(req.user!.organizationId);
    res.json(
      data.map((row) => ({
        ...row,
        updatedBy: typeof row.updatedBy === "string" ? row.updatedBy : "—",
      })),
    );
  } catch (e) {
    next(e);
  }
});

router.get("/templates/options", requirePermission("VIEW_ATTENDANCE"), async (_req: AuthedRequest, res, next) => {
  try {
    res.json(attendanceService.attendanceTemplateOptions);
  } catch (e) {
    next(e);
  }
});

router.get("/templates/default", requirePermission("VIEW_ATTENDANCE"), async (req: AuthedRequest, res, next) => {
  try {
    const data = await attendanceService.getDefaultAttendanceTemplate(req.user!.organizationId);
    res.json(data);
  } catch (e) {
    next(e);
  }
});

router.patch(
  "/templates/default",
  requireSaveDefaultAttendanceTemplate(),
  async (req: AuthedRequest, res, next) => {
    try {
      const body = templateSchema.parse(req.body);
      const data = await attendanceService.updateDefaultAttendanceTemplate(
        req.user!.organizationId,
        body,
        req.user!.id,
      );
      res.json(data);
    } catch (e) {
      next(e);
    }
  },
);

router.post("/check-in", requirePermission("MARK_ATTENDANCE"), async (req: AuthedRequest, res, next) => {
  try {
    const body = checkInSchema.parse(req.body);
    const data = await attendanceService.checkIn({
      organizationId: req.user!.organizationId,
      employeeId: body.employeeId,
      source: body.source,
    });
    res.status(201).json(data);
  } catch (e) {
    next(e);
  }
});

router.post("/check-out", requirePermission("MARK_ATTENDANCE"), async (req: AuthedRequest, res, next) => {
  try {
    const body = checkOutSchema.parse(req.body);
    const data = await attendanceService.checkOut({
      organizationId: req.user!.organizationId,
      employeeId: body.employeeId,
    });
    res.json(data);
  } catch (e) {
    next(e);
  }
});

router.post("/break-start", requirePermission("MARK_ATTENDANCE"), async (req: AuthedRequest, res, next) => {
  try {
    const body = breakSchema.parse(req.body);
    const data = await attendanceService.startBreak({
      organizationId: req.user!.organizationId,
      employeeId: body.employeeId,
      shiftBreakId: body.shiftBreakId,
    });
    res.json(data);
  } catch (e) {
    next(e);
  }
});

router.post("/break-end", requirePermission("MARK_ATTENDANCE"), async (req: AuthedRequest, res, next) => {
  try {
    const body = breakSchema.parse(req.body);
    const data = await attendanceService.endBreak({
      organizationId: req.user!.organizationId,
      employeeId: body.employeeId,
    });
    res.json(data);
  } catch (e) {
    next(e);
  }
});

router.post("/adjust", requirePermission("ADJUST_ATTENDANCE"), async (req: AuthedRequest, res, next) => {
  try {
    const body = adjustmentSchema.parse(req.body);
    const data = await attendanceService.adjustAttendance({
      organizationId: req.user!.organizationId,
      adjustedByUserId: req.user!.id,
      ...body,
    });
    res.json(data);
  } catch (e) {
    next(e);
  }
});

router.get("/dashboard/summary", requirePermission("VIEW_ATTENDANCE"), async (req: AuthedRequest, res, next) => {
  try {
    const data = await attendanceService.dashboardSummary(req.user!.organizationId);
    res.json(data);
  } catch (e) {
    next(e);
  }
});

router.get("/dashboard/recent", requirePermission("VIEW_ATTENDANCE"), async (req: AuthedRequest, res, next) => {
  try {
    const data = await attendanceService.recentAttendance(req.user!.organizationId);
    res.json(data);
  } catch (e) {
    next(e);
  }
});

export { router as attendanceRouter };
