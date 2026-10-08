import * as Crypto from "expo-crypto";
import { z } from "zod";

import { getOfflineUserScope } from "./api-resource-cache";
import { getAppDatabase } from "./database/app-database";

const outboxKindSchema = z.enum([
  "study.completeStep",
  "study.completeDay",
  "plan.setSaved",
  "plan.archive",
  "settings.update",
  "reminder.update",
]);

export type OutboxKind = z.infer<typeof outboxKindSchema>;

const rowSchema = z.object({
  id: z.string(),
  kind: outboxKindSchema,
  entity_key: z.string(),
  payload_json: z.string(),
  idempotency_key: z.string(),
  created_at: z.string(),
  attempt_count: z.number().int().nonnegative(),
  last_error_code: z.string().nullable(),
});

export interface OutboxMutation {
  id: string;
  kind: OutboxKind;
  entityKey: string;
  payload: unknown;
  idempotencyKey: string;
  createdAt: string;
  attemptCount: number;
  lastErrorCode: string | null;
}

export async function enqueueMutation(input: {
  kind: OutboxKind;
  entityKey: string;
  payload: unknown;
  idempotencyKey: string;
}): Promise<void> {
  const scopeId = await getOfflineUserScope();
  if (!scopeId)
    throw new Error("Cannot queue a server mutation without an authenticated offline scope");

  const db = await getAppDatabase();
  await db.execute(
    `INSERT INTO mutation_outbox (
       id, scope_id, kind, entity_key, payload_json, idempotency_key, created_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(idempotency_key) DO NOTHING`,
    [
      Crypto.randomUUID(),
      scopeId,
      input.kind,
      input.entityKey,
      JSON.stringify(input.payload),
      input.idempotencyKey,
      new Date().toISOString(),
    ],
  );
}

export async function listPendingMutations(): Promise<OutboxMutation[]> {
  const scopeId = await getOfflineUserScope();
  if (!scopeId) return [];
  const db = await getAppDatabase();
  const raw = await db.query(
    `SELECT id, kind, entity_key, payload_json, idempotency_key,
            created_at, attempt_count, last_error_code
       FROM mutation_outbox
      WHERE scope_id = ?
      ORDER BY created_at ASC, id ASC`,
    [scopeId],
  );

  const result: OutboxMutation[] = [];
  for (const candidate of raw) {
    const parsed = rowSchema.safeParse(candidate);
    if (!parsed.success) continue;
    let payload: unknown;
    try {
      payload = JSON.parse(parsed.data.payload_json);
    } catch {
      await removePendingMutation(parsed.data.id);
      continue;
    }
    result.push({
      id: parsed.data.id,
      kind: parsed.data.kind,
      entityKey: parsed.data.entity_key,
      payload,
      idempotencyKey: parsed.data.idempotency_key,
      createdAt: parsed.data.created_at,
      attemptCount: parsed.data.attempt_count,
      lastErrorCode: parsed.data.last_error_code,
    });
  }
  return result;
}

export async function recordMutationFailure(id: string, errorCode: string): Promise<void> {
  const db = await getAppDatabase();
  await db.execute(
    `UPDATE mutation_outbox
        SET attempt_count = attempt_count + 1,
            last_error_code = ?
      WHERE id = ?`,
    [errorCode, id],
  );
}

export async function removePendingMutation(id: string): Promise<void> {
  const db = await getAppDatabase();
  await db.execute("DELETE FROM mutation_outbox WHERE id = ?", [id]);
}
