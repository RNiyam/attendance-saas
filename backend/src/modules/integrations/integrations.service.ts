import { createHmac } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db } from "../../database";
import { integrationConfigs, webhookLogs } from "../../database/schema";

export async function upsertIntegrationConfig(input: {
  organizationId: number;
  provider: string;
  status?: "active" | "inactive";
  configJson?: Record<string, unknown>;
  webhookSecret?: string;
}) {
  const [existing] = await db
    .select()
    .from(integrationConfigs)
    .where(and(eq(integrationConfigs.organizationId, input.organizationId), eq(integrationConfigs.provider, input.provider)))
    .limit(1);
  if (existing) {
    await db
      .update(integrationConfigs)
      .set({
        status: input.status ?? existing.status,
        configJson: input.configJson ? JSON.stringify(input.configJson) : existing.configJson,
        webhookSecret: input.webhookSecret ?? existing.webhookSecret,
      })
      .where(eq(integrationConfigs.id, existing.id));
    return;
  }
  await db.insert(integrationConfigs).values({
    organizationId: input.organizationId,
    provider: input.provider,
    status: input.status ?? "inactive",
    configJson: input.configJson ? JSON.stringify(input.configJson) : undefined,
    webhookSecret: input.webhookSecret,
  });
}

export async function listIntegrationConfigs(organizationId: number) {
  return db.select().from(integrationConfigs).where(eq(integrationConfigs.organizationId, organizationId));
}

export async function dispatchWebhook(input: {
  organizationId: number;
  provider: string;
  endpointUrl: string;
  payload: Record<string, unknown>;
}) {
  const [cfg] = await db
    .select()
    .from(integrationConfigs)
    .where(and(eq(integrationConfigs.organizationId, input.organizationId), eq(integrationConfigs.provider, input.provider)))
    .limit(1);
  if (!cfg || cfg.status !== "active") {
    const err = new Error("Active integration config not found");
    (err as { status?: number }).status = 400;
    throw err;
  }
  const payloadText = JSON.stringify(input.payload);
  const signature = cfg.webhookSecret
    ? createHmac("sha256", cfg.webhookSecret).update(payloadText).digest("hex")
    : "";

  const response = await fetch(input.endpointUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-webhook-signature": signature,
    },
    body: payloadText,
  }).catch((e) => ({ ok: false, status: 0, text: async () => String(e) } as Response));

  const body = await response.text();
  await db.insert(webhookLogs).values({
    organizationId: input.organizationId,
    provider: input.provider,
    endpointUrl: input.endpointUrl,
    payload: payloadText,
    responseCode: response.status,
    responseBody: body.slice(0, 4000),
    status: response.ok ? "success" : "failed",
  });

  return { ok: response.ok, status: response.status, body };
}
