import { Router } from "express";
import { z } from "zod";
import { authMiddleware, requirePermission, resolvePermissions, type AuthedRequest } from "../../middleware/auth";
import * as employeesService from "./employees.service";
import { uploadBase64ToS3 } from "./s3.utils";
import { db } from "../../database";
import { employees } from "../../database/schema";
import { eq } from "drizzle-orm";

const router = Router();

const inviteSchema = z.object({
  firstName: z.string().min(1).max(120),
  lastName: z.string().max(120).optional(),
  email: z.string().email(),
  phone: z.string().max(32).optional(),
  employeeCode: z.string().min(1).max(64),
  joiningDate: z.string().min(8),
  employeeType: z
    .enum(["FULL_TIME", "PART_TIME", "INTERN", "PROBATION"])
    .optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  dob: z.string().min(8).optional(),
  workLocation: z.string().max(120).optional(),
  managerName: z.string().max(150).optional(),
  managerEmployeeId: z.number().int().positive().optional(),
  branchId: z.number().int().positive().optional(),
  departmentId: z.number().int().positive().optional(),
  designationId: z.number().int().positive().optional(),
  shiftId: z.number().int().positive().optional(),
  attendancePolicyId: z.number().int().positive().optional(),
  holidayTemplateId: z.number().int().positive().optional(),
  leavePolicyTemplateId: z.number().int().positive().optional(),
  salaryTemplateId: z.number().int().positive().optional(),
  weeklyOffPolicy: z.string().max(120).optional(),
  ctc: z.string().max(20).optional(),
  salaryStructure: z.string().max(120).optional(),
  bankAccountNumber: z.string().max(64).optional(),
  bankIfsc: z.string().max(20).optional(),
  pan: z.string().max(20).optional(),
  aadhaar: z.string().max(20).optional(),
  pfNumber: z.string().max(64).optional(),
  esiNumber: z.string().max(64).optional(),
  workHoursPerWeek: z.string().max(20).optional(),
  hourlyRate: z.string().max(20).optional(),
  proratedSalaryPercent: z.string().max(20).optional(),
  contractStart: z.string().min(8).optional(),
  contractEnd: z.string().min(8).optional(),
  vendorCompany: z.string().max(150).optional(),
  billingCycle: z.enum(["weekly", "monthly", "project", "milestone"]).optional(),
  invoiceAmount: z.string().max(20).optional(),
  dailyWage: z.string().max(20).optional(),
  workUnit: z.enum(["day", "hour", "piece"]).optional(),
  supervisor: z.string().max(150).optional(),
  internshipStart: z.string().min(8).optional(),
  internshipEnd: z.string().min(8).optional(),
  mentor: z.string().max(150).optional(),
  stipend: z.string().max(20).optional(),
  college: z.string().max(180).optional(),
  probationStart: z.string().min(8).optional(),
  probationEnd: z.string().min(8).optional(),
  confirmationDate: z.string().min(8).optional(),
  onboardingNotes: z.string().max(4000).optional(),
  sendInvite: z.boolean().optional(),
  invitedByName: z.string().min(1).default("HR Team"),
  appInviteBaseUrl: z.string().url().optional(),
});

const activateSchema = z.object({
  token: z.string().min(20),
  password: z.string().min(8).max(128),
});

router.post("/activate", async (req, res, next) => {
  try {
    const body = activateSchema.parse(req.body);
    const result = await employeesService.activateEmployeeInvite(body.token, body.password);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.use(authMiddleware, resolvePermissions);

router.get("/onboarding-options", requirePermission("VIEW_EMPLOYEE"), async (req: AuthedRequest, res, next) => {
  try {
    const result = await employeesService.getEmployeeOnboardingOptions(req.user!.organizationId);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.post("/onboard", requirePermission("INVITE_EMPLOYEE"), async (req: AuthedRequest, res, next) => {
  try {
    const body = inviteSchema.parse(req.body);
    const result = await employeesService.inviteEmployee({
      organizationId: req.user!.organizationId,
      ...body,
    });
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
});

router.post("/invite", requirePermission("INVITE_EMPLOYEE"), async (req: AuthedRequest, res, next) => {
  try {
    const body = inviteSchema.parse(req.body);
    const result = await employeesService.inviteEmployee({
      organizationId: req.user!.organizationId,
      ...body,
    });
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
});

router.get("/", requirePermission("VIEW_EMPLOYEE"), async (req: AuthedRequest, res, next) => {
  try {
    const result = await employeesService.listEmployees(req.user!.organizationId);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.get("/:id", requirePermission("VIEW_EMPLOYEE"), async (req: AuthedRequest, res, next) => {
  try {
    const employeeId = Number(req.params.id);
    if (!Number.isFinite(employeeId)) {
      res.status(400).json({ error: "Invalid employee id" });
      return;
    }
    const result = await employeesService.getEmployeeById(req.user!.organizationId, employeeId);
    if (!result) {
      res.status(404).json({ error: "Employee not found" });
      return;
    }
    res.json(result);
  } catch (e) {
    next(e);
  }
});

const registerFaceSchema = z.object({
  embedding: z.array(z.number()),
  base64Image: z.string().optional(),
});

router.post("/:id/face", async (req: AuthedRequest, res, next) => {
  try {
    const employeeId = Number(req.params.id);
    if (!Number.isFinite(employeeId)) {
      res.status(400).json({ error: "Invalid employee id" });
      return;
    }

    const [emp] = await db.select({ userId: employees.userId }).from(employees).where(eq(employees.id, employeeId)).limit(1);
    if (!emp) {
      res.status(404).json({ error: "Employee not found" });
      return;
    }

    if (emp.userId !== req.user!.id && !req.user!.permissions.includes("EDIT_EMPLOYEE")) {
      res.status(403).json({ error: "Missing permission: EDIT_EMPLOYEE" });
      return;
    }
    const body = registerFaceSchema.parse(req.body);
    
    let imageUrl: string | undefined;
    if (body.base64Image) {
      imageUrl = await uploadBase64ToS3(body.base64Image);
    }

    const result = await employeesService.registerEmployeeFace(req.user!.organizationId, employeeId, body.embedding, imageUrl);
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
});

export { router as employeesRouter };
