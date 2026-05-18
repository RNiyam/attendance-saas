/**
 * Regenerate: node postman/build-collection.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const saveTokensScript = [
  "const c = pm.response.code;",
  "if (c !== 200 && c !== 201) return;",
  "try {",
  "  const j = pm.response.json();",
  "  if (j.accessToken) {",
  "    pm.environment.set('accessToken', j.accessToken);",
  "    pm.collectionVariables.set('accessToken', j.accessToken);",
  "  }",
  "  if (j.refreshToken) {",
  "    pm.environment.set('refreshToken', j.refreshToken);",
  "    pm.collectionVariables.set('refreshToken', j.refreshToken);",
  "  }",
  "} catch (e) {}",
];

function R(name, method, urlPath, options = {}) {
  const item = {
    name,
    request: {
      method,
      header: options.noJsonHeader
        ? []
        : [
            {
              key: "Content-Type",
              value: "application/json",
            },
          ],
      url: `{{baseUrl}}${urlPath}`,
      auth: options.bearer
        ? {
            type: "bearer",
            bearer: [{ key: "token", value: "{{accessToken}}", type: "string" }],
          }
        : { type: "noauth" },
    },
  };
  if (options.body) {
    item.request.body = { mode: "raw", raw: JSON.stringify(options.body, null, 2) };
  }
  if (options.urlObject) {
    item.request.url = options.urlObject;
  }
  if (options.tests) {
    item.event = [{ listen: "test", script: { type: "text/javascript", exec: options.tests } }];
  }
  return item;
}

const collection = {
  info: {
    name: "WorkforceOS API",
    description:
      "Backend routes from `backend/src/app.ts`. Import **WorkforceOS-Local.postman_environment.json**, select the environment, then **Auth → Login** (or Signup). Test scripts save `accessToken` and `refreshToken` to the active environment and collection variables.\n\nProtected routes need a JWT with permissions seeded for your org role (owner on signup gets full RBAC). Default `baseUrl`: `http://localhost:5000` — change if your server uses port fallback.",
    schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
  },
  variable: [
    { key: "baseUrl", value: "http://localhost:5000" },
    { key: "accessToken", value: "" },
    { key: "refreshToken", value: "" },
    { key: "organizationSlug", value: "acme-demo" },
    { key: "employeeId", value: "1" },
    { key: "recordId", value: "1" },
    { key: "shiftId", value: "1" },
    { key: "leaveTypeId", value: "1" },
    { key: "leaveRequestId", value: "1" },
    { key: "payrollCycleId", value: "1" },
  ],
  item: [
    {
      name: "Health",
      item: [R("Health check", "GET", "/health", { noJsonHeader: true })],
    },
    {
      name: "Auth",
      item: [
        R("Signup", "POST", "/api/auth/signup", {
          body: {
            organizationName: "Acme Demo",
            organizationSlug: "{{organizationSlug}}",
            ownerEmail: "owner@example.com",
            password: "password123",
            ownerDisplayName: "Owner",
          },
          tests: saveTokensScript,
        }),
        R("Login", "POST", "/api/auth/login", {
          body: {
            organizationSlug: "{{organizationSlug}}",
            email: "owner@example.com",
            password: "password123",
          },
          tests: saveTokensScript,
        }),
        R("Refresh tokens", "POST", "/api/auth/refresh", {
          body: { refreshToken: "{{refreshToken}}" },
          tests: saveTokensScript,
        }),
        R("Logout", "POST", "/api/auth/logout", {
          body: { refreshToken: "{{refreshToken}}" },
        }),
        R("Me (current user)", "GET", "/api/auth/me", { bearer: true, noJsonHeader: true }),
      ],
    },
    {
      name: "Employees",
      item: [
        R("Activate invite (public)", "POST", "/api/employees/activate", {
          body: {
            token: "paste-invite-jwt-from-email-or-db",
            password: "password123",
          },
        }),
        R("Invite employee", "POST", "/api/employees/invite", {
          bearer: true,
          body: {
            firstName: "Jane",
            lastName: "Doe",
            email: "jane@example.com",
            employeeCode: "EMP-001",
            joiningDate: "2026-01-15",
            branchId: 1,
            departmentId: 1,
            designationId: 1,
            invitedByName: "HR Team",
          },
        }),
        R("List employees", "GET", "/api/employees", { bearer: true, noJsonHeader: true }),
        R("Get employee by ID", "GET", "/api/employees/{{employeeId}}", { bearer: true, noJsonHeader: true }),
      ],
    },
    {
      name: "Organization",
      item: [
        R("List branches", "GET", "/api/organization/branches", { bearer: true, noJsonHeader: true }),
        R("Create branch", "POST", "/api/organization/branches", {
          bearer: true,
          body: { name: "HQ", address: "1 Main St", timezone: "Asia/Kolkata" },
        }),
        R("List departments", "GET", "/api/organization/departments", { bearer: true, noJsonHeader: true }),
        R("Create department", "POST", "/api/organization/departments", {
          bearer: true,
          body: { name: "Engineering", description: "Product", branchId: 1 },
        }),
        R("List designations", "GET", "/api/organization/designations", { bearer: true, noJsonHeader: true }),
        R("Create designation", "POST", "/api/organization/designations", {
          bearer: true,
          body: { title: "Senior Engineer", level: "L5" },
        }),
      ],
    },
    {
      name: "Attendance",
      item: [
        R("Check in", "POST", "/api/attendance/check-in", {
          bearer: true,
          body: { employeeId: 1, source: "manual" },
        }),
        R("Check out", "POST", "/api/attendance/check-out", { bearer: true, body: { employeeId: 1 } }),
        R("Break start", "POST", "/api/attendance/break-start", { bearer: true, body: { employeeId: 1 } }),
        R("Break end", "POST", "/api/attendance/break-end", { bearer: true, body: { employeeId: 1 } }),
        R("Adjust attendance", "POST", "/api/attendance/adjust", {
          bearer: true,
          body: {
            recordId: 1,
            reason: "Manager correction for missed punch",
            newCheckIn: "2026-05-13T09:00:00.000Z",
            newCheckOut: "2026-05-13T18:00:00.000Z",
          },
        }),
        R("Dashboard summary", "GET", "/api/attendance/dashboard/summary", { bearer: true, noJsonHeader: true }),
        R("Dashboard recent", "GET", "/api/attendance/dashboard/recent", { bearer: true, noJsonHeader: true }),
      ],
    },
    {
      name: "Shifts",
      item: [
        R("List shifts", "GET", "/api/shifts/", { bearer: true, noJsonHeader: true }),
        R("Create shift", "POST", "/api/shifts/", {
          bearer: true,
          body: {
            name: "General Day",
            shiftType: "fixed",
            startTime: "09:00",
            endTime: "18:00",
            branchId: 1,
            gracePeriodMinutes: 10,
            overtimeEnabled: 1,
            lateMarkEnabled: 1,
            weeklyOffPolicy: "Sun",
          },
        }),
        R("Assign shift", "POST", "/api/shifts/assignments", {
          bearer: true,
          body: {
            employeeId: 1,
            shiftId: 1,
            effectiveFrom: "2026-01-01",
            effectiveTo: "2026-12-31",
            isTemporary: 0,
          },
        }),
        R("List holidays", "GET", "/api/shifts/holidays", { bearer: true, noJsonHeader: true }),
        R("Create holiday", "POST", "/api/shifts/holidays", {
          bearer: true,
          body: { name: "Republic Day", holidayDate: "2026-01-26", branchId: 1 },
        }),
        R("List attendance policies", "GET", "/api/shifts/policies", { bearer: true, noJsonHeader: true }),
        R("Create attendance policy", "POST", "/api/shifts/policies", {
          bearer: true,
          body: {
            name: "Default",
            lateAfterMinutes: 10,
            halfDayAfterMinutes: 240,
            overtimeAfterMinutes: 30,
            weeklyOffDays: "0,6",
          },
        }),
        R("Validate shift context", "POST", "/api/shifts/validate-context", {
          bearer: true,
          body: { employeeId: 1, date: "2026-05-13" },
        }),
      ],
    },
    {
      name: "Leaves",
      item: [
        R("List leave types", "GET", "/api/leaves/types", { bearer: true, noJsonHeader: true }),
        R("Create leave type", "POST", "/api/leaves/types", {
          bearer: true,
          body: { name: "Annual Leave", code: "AL", annualQuota: "18", isPaid: 1 },
        }),
        R("Upsert leave balance", "POST", "/api/leaves/balances", {
          bearer: true,
          body: { employeeId: 1, leaveTypeId: 1, allocated: "18" },
        }),
        R("List leave requests", "GET", "/api/leaves/requests", { bearer: true, noJsonHeader: true }),
        R("Create leave request", "POST", "/api/leaves/requests", {
          bearer: true,
          body: {
            employeeId: 1,
            leaveTypeId: 1,
            startDate: "2026-06-01",
            endDate: "2026-06-03",
            reason: "Family event",
          },
        }),
        R("Approve / reject leave", "POST", "/api/leaves/requests/decision", {
          bearer: true,
          body: { leaveRequestId: 1, decision: "approved", comment: "OK" },
        }),
      ],
    },
    {
      name: "Payroll",
      item: [
        R("List payroll cycles", "GET", "/api/payroll/cycles", { bearer: true, noJsonHeader: true }),
        R("Create payroll cycle", "POST", "/api/payroll/cycles", {
          bearer: true,
          body: { name: "May 2026", startDate: "2026-05-01", endDate: "2026-05-31" },
        }),
        R("Add payroll adjustment", "POST", "/api/payroll/adjustments", {
          bearer: true,
          body: {
            employeeId: 1,
            payrollCycleId: 1,
            adjustmentType: "bonus",
            amount: "5000",
            reason: "Performance bonus",
          },
        }),
        R("Run payroll", "POST", "/api/payroll/run", { bearer: true, body: { payrollCycleId: 1 } }),
        R("List payslips", "GET", "/api/payroll/payslips?payrollCycleId={{payrollCycleId}}", {
          bearer: true,
          noJsonHeader: true,
        }),
      ],
    },
    {
      name: "Files",
      item: [
        R("Upload (base64)", "POST", "/api/files/upload", {
          bearer: true,
          body: {
            folder: "documents",
            filename: "sample.txt",
            base64Content: Buffer.from("hello workforce").toString("base64"),
            contentType: "text/plain",
          },
        }),
      ],
    },
    {
      name: "Integrations",
      item: [
        R("List integration configs", "GET", "/api/integrations/configs", { bearer: true, noJsonHeader: true }),
        R("Upsert integration config", "POST", "/api/integrations/configs", {
          bearer: true,
          body: {
            provider: "slack",
            status: "active",
            configJson: { webhookUrl: "https://hooks.slack.com/services/xxx" },
          },
        }),
        R("Dispatch webhook", "POST", "/api/integrations/dispatch-webhook", {
          bearer: true,
          body: {
            provider: "slack",
            endpointUrl: "https://httpbin.org/post",
            payload: { event: "employee.created", id: 1 },
          },
        }),
      ],
    },
  ],
};

const out = path.join(__dirname, "WorkforceOS-API.postman_collection.json");
fs.writeFileSync(out, JSON.stringify(collection, null, 2));
console.log("Wrote", out);
