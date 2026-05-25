import { Router } from "express";
import { z } from "zod";
import { authMiddleware, requirePermission, resolvePermissions, type AuthedRequest } from "../../middleware/auth";
import * as permissionsService from "./permissions.service";

const router = Router();

// Only the OWNER should be able to manage role permissions, but we'll use a generic permission check 
// or enforce it strictly based on the role. In this app, OWNER has all permissions.
// Actually, let's just make sure only users with 'MANAGE_ROLES' or if they are the OWNER.
// The user requested: "restricted exclusively to users who hold the OWNER role".
// We can check `req.user.role` if available, or just verify they have all permissions,
// but the safest is to verify the user actually holds the 'OWNER' role by querying the database,
// or we can add a custom middleware. For now, let's just query the DB for the user's role.
import { db } from "../../database";
import { roles, userRoles } from "../../database/schema";
import { and, eq } from "drizzle-orm";

async function requireOwnerRole(req: AuthedRequest, res: any, next: any) {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const roleRows = await db
    .select({ name: roles.name })
    .from(userRoles)
    .innerJoin(roles, eq(roles.id, userRoles.roleId))
    .where(eq(userRoles.userId, req.user.id));
  
  const isOwner = roleRows.some(r => r.name === "OWNER");
  if (!isOwner) {
    res.status(403).json({ error: "Only the OWNER can manage permissions" });
    return;
  }
  next();
}

router.use(authMiddleware, resolvePermissions, requireOwnerRole);

router.get("/", async (req: AuthedRequest, res, next) => {
  try {
    const data = await permissionsService.listRolesAndPermissions(req.user!.organizationId);
    res.json(data);
  } catch (e) {
    next(e);
  }
});

const updatePermissionsSchema = z.object({
  roleId: z.coerce.number().int().positive(),
  permissionIds: z.array(z.coerce.number().int().positive()),
});

router.patch("/", async (req: AuthedRequest, res, next) => {
  try {
    const body = updatePermissionsSchema.parse(req.body);
    await permissionsService.updateRolePermissions(
      req.user!.organizationId,
      req.user!.id,
      body.roleId,
      body.permissionIds
    );
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export { router as permissionsRouter };
