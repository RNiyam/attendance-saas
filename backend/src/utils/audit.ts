import { db } from "../database";
import { activityLogs, auditLogs } from "../database/schema";

export async function writeAuditLog(input: {
  organizationId?: number;
  actorUserId?: number;
  action: string;
  entityType: string;
  entityId: string;
  beforeData?: unknown;
  afterData?: unknown;
  requestId?: string;
}) {
  await db.insert(auditLogs).values({
    organizationId: input.organizationId,
    actorUserId: input.actorUserId,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    beforeData: input.beforeData ? JSON.stringify(input.beforeData) : undefined,
    afterData: input.afterData ? JSON.stringify(input.afterData) : undefined,
    requestId: input.requestId,
  });
}

export async function writeActivityLog(input: {
  organizationId?: number;
  userId?: number;
  activityType: string;
  metadata?: unknown;
  ipAddress?: string;
}) {
  await db.insert(activityLogs).values({
    organizationId: input.organizationId,
    userId: input.userId,
    activityType: input.activityType,
    metadata: input.metadata ? JSON.stringify(input.metadata) : undefined,
    ipAddress: input.ipAddress,
  });
}
