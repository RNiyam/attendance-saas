import { eq, inArray, and } from "drizzle-orm";
import { db } from "../../database";
import { permissions, rolePermissions, roles } from "../../database/schema";
import { writeActivityLog } from "../../utils/audit";

export async function listRolesAndPermissions(organizationId: number) {
  const allRoles = await db.select().from(roles).where(eq(roles.organizationId, organizationId));
  const allPermissions = await db.select().from(permissions);
  const allRolePermissions = await db
    .select({
      roleId: rolePermissions.roleId,
      permissionId: rolePermissions.permissionId,
    })
    .from(rolePermissions)
    .innerJoin(roles, eq(roles.id, rolePermissions.roleId))
    .where(eq(roles.organizationId, organizationId));

  const roleMap = new Map<number, string[]>();
  for (const rp of allRolePermissions) {
    const arr = roleMap.get(rp.roleId) || [];
    arr.push(String(rp.permissionId));
    roleMap.set(rp.roleId, arr);
  }

  return {
    roles: allRoles.map(r => ({
      id: String(r.id),
      name: r.name,
      description: r.description,
      isSystemRole: r.isSystemRole,
      permissionIds: roleMap.get(r.id) || [],
    })),
    permissions: allPermissions.map(p => ({
      id: String(p.id),
      code: p.code,
      module: p.module,
      description: p.description,
    })),
  };
}

export async function updateRolePermissions(
  organizationId: number,
  userId: number,
  roleId: number,
  permissionIds: number[]
) {
  const [role] = await db
    .select()
    .from(roles)
    .where(and(eq(roles.id, roleId), eq(roles.organizationId, organizationId)))
    .limit(1);

  if (!role) {
    const err = new Error("Role not found");
    (err as any).status = 404;
    throw err;
  }
  
  if (role.name === "OWNER") {
    const err = new Error("Cannot modify OWNER role permissions");
    (err as any).status = 403;
    throw err;
  }

  const validPermissions = permissionIds.length > 0 
    ? await db.select().from(permissions).where(inArray(permissions.id, permissionIds))
    : [];

  const validIds = validPermissions.map(p => p.id);

  await db.transaction(async (tx) => {
    await tx.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId));
    if (validIds.length > 0) {
      await tx.insert(rolePermissions).values(
        validIds.map(pid => ({ roleId, permissionId: pid }))
      );
    }
  });

  await writeActivityLog({
    organizationId,
    userId,
    activityType: "settings.permissions_updated",
    metadata: { roleName: role.name, permissionCount: validIds.length },
  });
}
