import { Router } from "express";
import { z } from "zod";
import { authMiddleware, requirePermission, resolvePermissions, type AuthedRequest } from "../../middleware/auth";
import * as payrollService from "./payroll.service";

const router = Router();

const cycleSchema = z.object({
  name: z.string().min(2).max(100),
  startDate: z.string().min(8),
  endDate: z.string().min(8),
});

const adjustmentSchema = z.object({
  employeeId: z.number().int().positive(),
  payrollCycleId: z.number().int().positive(),
  adjustmentType: z.enum(["bonus", "deduction"]),
  amount: z.string().min(1),
  reason: z.string().max(255).optional(),
});

const runSchema = z.object({
  payrollCycleId: z.number().int().positive(),
});

router.use(authMiddleware, resolvePermissions);

router.get("/cycles", requirePermission("RUN_PAYROLL"), async (req: AuthedRequest, res, next) => {
  try {
    const data = await payrollService.listPayrollCycles(req.user!.organizationId);
    res.json(data);
  } catch (e) {
    next(e);
  }
});

router.post("/cycles", requirePermission("RUN_PAYROLL"), async (req: AuthedRequest, res, next) => {
  try {
    const body = cycleSchema.parse(req.body);
    await payrollService.createPayrollCycle({ organizationId: req.user!.organizationId, ...body });
    res.status(201).json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.post("/adjustments", requirePermission("RUN_PAYROLL"), async (req: AuthedRequest, res, next) => {
  try {
    const body = adjustmentSchema.parse(req.body);
    await payrollService.addPayrollAdjustment({ organizationId: req.user!.organizationId, ...body });
    res.status(201).json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.post("/run", requirePermission("RUN_PAYROLL"), async (req: AuthedRequest, res, next) => {
  try {
    const body = runSchema.parse(req.body);
    const result = await payrollService.runPayroll({ organizationId: req.user!.organizationId, ...body });
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.get("/payslips", requirePermission("RUN_PAYROLL"), async (req: AuthedRequest, res, next) => {
  try {
    const cycleId = req.query.payrollCycleId ? Number(req.query.payrollCycleId) : undefined;
    const data = await payrollService.listPayslips({
      organizationId: req.user!.organizationId,
      payrollCycleId: Number.isFinite(cycleId) ? cycleId : undefined,
    });
    res.json(data);
  } catch (e) {
    next(e);
  }
});

export { router as payrollRouter };
