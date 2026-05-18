import { Router } from "express";
import { z } from "zod";
import { authMiddleware, requirePermission, resolvePermissions, type AuthedRequest } from "../../middleware/auth";
import * as leaveService from "./leave.service";

const router = Router();

const leaveTypeSchema = z.object({
  name: z.string().min(2).max(100),
  code: z.string().min(2).max(30).toUpperCase(),
  annualQuota: z.string().min(1),
  isPaid: z.number().int().min(0).max(1).optional(),
});

const balanceSchema = z.object({
  employeeId: z.number().int().positive(),
  leaveTypeId: z.number().int().positive(),
  allocated: z.string().min(1),
});

const requestSchema = z.object({
  employeeId: z.number().int().positive(),
  leaveTypeId: z.number().int().positive(),
  startDate: z.string().min(8),
  endDate: z.string().min(8),
  reason: z.string().max(300).optional(),
});

const decisionSchema = z.object({
  leaveRequestId: z.number().int().positive(),
  decision: z.enum(["approved", "rejected"]),
  comment: z.string().max(300).optional(),
});

const leavePolicyApproverSchema = z.object({
  approverType: z.enum([
    "owner",
    "admin",
    "restricted_admin",
    "attendance_supervisors",
    "reporting_manager",
  ]),
  approverName: z.string().trim().min(1).max(150),
  substituteEnabled: z.number().int().min(0).max(1).optional(),
  sortOrder: z.number().int().min(0).max(999).optional(),
});

const leavePolicyApprovalLevelSchema = z.object({
  levelOrder: z.number().int().min(1).max(20),
  minApproversRequired: z.number().int().min(0).max(50),
  approvers: z.array(leavePolicyApproverSchema).max(30),
});

const leavePolicyTemplateSchema = z.object({
  name: z.string().trim().min(2).max(150),
  startDate: z.string().min(8),
  endDate: z.string().min(8),
  policyCycle: z.enum(["yearly", "monthly", "quarterly"]).optional(),
  unpaidLeaveEnabled: z.number().int().min(0).max(1).optional(),
  countSandwichLeaves: z.number().int().min(0).max(1).optional(),
  approvalLevels: z.array(leavePolicyApprovalLevelSchema).max(20).optional(),
  leaves: z
    .array(
      z.object({
        leaveName: z.string().trim().min(2).max(100),
        leaveCode: z.string().trim().min(1).max(30).optional(),
        annualQuota: z.string().optional(),
        isPaid: z.number().int().min(0).max(1).optional(),
        accrualPeriod: z.enum(["all_at_once", "monthly", "quarterly", "na"]).optional(),
        isSystem: z.number().int().min(0).max(1).optional(),
        customFieldsCount: z.number().int().min(0).max(99).optional(),
        sortOrder: z.number().int().min(0).max(999).optional(),
      }),
    )
    .max(50)
    .default([]),
});

const templateIdParam = z.coerce.number().int().positive();

router.use(authMiddleware, resolvePermissions);

router.get("/policy-templates", requirePermission("REQUEST_LEAVE"), async (req: AuthedRequest, res, next) => {
  try {
    const data = await leaveService.listLeavePolicyTemplates(req.user!.organizationId);
    res.json(data);
  } catch (e) {
    next(e);
  }
});

router.post("/policy-templates", requirePermission("MANAGE_LEAVE_TYPES"), async (req: AuthedRequest, res, next) => {
  try {
    const body = leavePolicyTemplateSchema.parse(req.body);
    const data = await leaveService.createLeavePolicyTemplate({
      organizationId: req.user!.organizationId,
      ...body,
    });
    res.status(201).json(data);
  } catch (e) {
    next(e);
  }
});

router.get("/policy-templates/:templateId", requirePermission("REQUEST_LEAVE"), async (req: AuthedRequest, res, next) => {
  try {
    const templateId = templateIdParam.parse(req.params.templateId);
    const data = await leaveService.getLeavePolicyTemplate(req.user!.organizationId, templateId);
    if (!data) {
      res.status(404).json({ error: "Leave policy template not found" });
      return;
    }
    res.json(data);
  } catch (e) {
    next(e);
  }
});

router.put("/policy-templates/:templateId", requirePermission("MANAGE_LEAVE_TYPES"), async (req: AuthedRequest, res, next) => {
  try {
    const templateId = templateIdParam.parse(req.params.templateId);
    const body = leavePolicyTemplateSchema.parse(req.body);
    const data = await leaveService.updateLeavePolicyTemplate({
      organizationId: req.user!.organizationId,
      templateId,
      ...body,
    });
    if (!data) {
      res.status(404).json({ error: "Leave policy template not found" });
      return;
    }
    res.json(data);
  } catch (e) {
    next(e);
  }
});

router.delete(
  "/policy-templates/:templateId",
  requirePermission("MANAGE_LEAVE_TYPES"),
  async (req: AuthedRequest, res, next) => {
    try {
      const templateId = templateIdParam.parse(req.params.templateId);
      const ok = await leaveService.deleteLeavePolicyTemplate(req.user!.organizationId, templateId);
      if (!ok) {
        res.status(404).json({ error: "Leave policy template not found" });
        return;
      }
      res.json({ ok: true });
    } catch (e) {
      next(e);
    }
  },
);

router.get(
  "/policy-templates/:templateId/approval-levels",
  requirePermission("REQUEST_LEAVE"),
  async (req: AuthedRequest, res, next) => {
    try {
      const templateId = templateIdParam.parse(req.params.templateId);
      const data = await leaveService.getLeavePolicyApprovalLevels(req.user!.organizationId, templateId);
      res.json(data);
    } catch (e) {
      next(e);
    }
  },
);

router.put(
  "/policy-templates/:templateId/approval-levels",
  requirePermission("MANAGE_LEAVE_TYPES"),
  async (req: AuthedRequest, res, next) => {
    try {
      const templateId = templateIdParam.parse(req.params.templateId);
      const body = z.object({ levels: z.array(leavePolicyApprovalLevelSchema).max(20) }).parse(req.body);
      const data = await leaveService.saveLeavePolicyApprovalLevels(
        req.user!.organizationId,
        templateId,
        body.levels,
      );
      if (!data) {
        res.status(404).json({ error: "Leave policy template not found" });
        return;
      }
      res.json(data);
    } catch (e) {
      next(e);
    }
  },
);

router.post(
  "/policy-templates/:templateId/clone",
  requirePermission("MANAGE_LEAVE_TYPES"),
  async (req: AuthedRequest, res, next) => {
    try {
      const templateId = templateIdParam.parse(req.params.templateId);
      const data = await leaveService.cloneLeavePolicyTemplate(req.user!.organizationId, templateId);
      if (!data) {
        res.status(404).json({ error: "Leave policy template not found" });
        return;
      }
      res.status(201).json(data);
    } catch (e) {
      next(e);
    }
  },
);

router.get("/types", requirePermission("REQUEST_LEAVE"), async (req: AuthedRequest, res, next) => {
  try {
    const data = await leaveService.listLeaveTypes(req.user!.organizationId);
    res.json(data);
  } catch (e) {
    next(e);
  }
});

router.post("/types", requirePermission("MANAGE_LEAVE_TYPES"), async (req: AuthedRequest, res, next) => {
  try {
    const body = leaveTypeSchema.parse(req.body);
    await leaveService.createLeaveType({ organizationId: req.user!.organizationId, ...body });
    res.status(201).json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.post("/balances", requirePermission("MANAGE_LEAVE_TYPES"), async (req: AuthedRequest, res, next) => {
  try {
    const body = balanceSchema.parse(req.body);
    await leaveService.upsertLeaveBalance({ organizationId: req.user!.organizationId, ...body });
    res.status(201).json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.get("/requests", requirePermission("REQUEST_LEAVE"), async (req: AuthedRequest, res, next) => {
  try {
    const data = await leaveService.listLeaveRequests(req.user!.organizationId);
    res.json(data);
  } catch (e) {
    next(e);
  }
});

router.post("/requests", requirePermission("REQUEST_LEAVE"), async (req: AuthedRequest, res, next) => {
  try {
    const body = requestSchema.parse(req.body);
    await leaveService.requestLeave({ organizationId: req.user!.organizationId, ...body });
    res.status(201).json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.post("/requests/decision", requirePermission("APPROVE_LEAVE"), async (req: AuthedRequest, res, next) => {
  try {
    const body = decisionSchema.parse(req.body);
    await leaveService.decideLeave({
      organizationId: req.user!.organizationId,
      approverUserId: req.user!.id,
      ...body,
    });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export { router as leaveRouter };
