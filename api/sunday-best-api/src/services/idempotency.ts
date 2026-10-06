import { and, eq } from "drizzle-orm";

import type { Database } from "../db/client.js";
import { idempotencyKeys } from "../db/schema.js";
import { stableFingerprint } from "../domain/crypto.js";
import { AppError } from "../http/errors.js";

const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;
const PENDING_STALE_MS = 30_000;

export function requireIdempotencyKey(value: string | string[] | undefined): string {
  const key = Array.isArray(value) ? value[0] : value;
  if (!key || key.length < 8 || key.length > 200) {
    throw new AppError("VALIDATION_FAILED", "Idempotency-Key must be 8-200 characters");
  }
  return key;
}

export async function runIdempotent<T>(input: {
  db: Database;
  userId: string;
  key: string;
  method: string;
  path: string;
  body: unknown;
  action: () => Promise<T>;
}): Promise<T> {
  const requestHash = stableFingerprint({ method: input.method, path: input.path, body: input.body });

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const existing = await input.db
      .select()
      .from(idempotencyKeys)
      .where(and(eq(idempotencyKeys.userId, input.userId), eq(idempotencyKeys.key, input.key)))
      .limit(1);
    const row = existing[0];

    if (row) {
      if (row.expiresAt <= new Date()) {
        await input.db.delete(idempotencyKeys).where(eq(idempotencyKeys.id, row.id));
        continue;
      }

      if (row.status === "completed") {
        return replayOrThrow(row, input.method, input.path, requestHash) as T;
      }

      if (row.method !== input.method || row.path !== input.path || row.requestHash !== requestHash) {
        throw new AppError("IDEMPOTENCY_CONFLICT", "Idempotency key was already used for a different request");
      }

      // A process can die after claiming the key. Short mutations in this API
      // should never legitimately remain pending this long, so reclaim the row
      // rather than blocking the client until the 24-hour TTL expires.
      if (row.createdAt.getTime() <= Date.now() - PENDING_STALE_MS) {
        const deleted = await input.db
          .delete(idempotencyKeys)
          .where(and(eq(idempotencyKeys.id, row.id), eq(idempotencyKeys.status, "pending")))
          .returning({ id: idempotencyKeys.id });
        if (deleted[0]) continue;
      }

      throw new AppError("RATE_LIMITED", "Identical request is still being processed");
    }

    try {
      await input.db.insert(idempotencyKeys).values({
        userId: input.userId,
        key: input.key,
        method: input.method,
        path: input.path,
        requestHash,
        expiresAt: new Date(Date.now() + IDEMPOTENCY_TTL_MS),
      });
    } catch (cause) {
      if (isUniqueViolation(cause)) continue;
      throw cause;
    }

    try {
      const response = await input.action();
      await input.db
        .update(idempotencyKeys)
        .set({ status: "completed", responseStatus: 200, responseBody: response, completedAt: new Date() })
        .where(and(eq(idempotencyKeys.userId, input.userId), eq(idempotencyKeys.key, input.key)));
      return response;
    } catch (cause) {
      await input.db
        .delete(idempotencyKeys)
        .where(
          and(
            eq(idempotencyKeys.userId, input.userId),
            eq(idempotencyKeys.key, input.key),
            eq(idempotencyKeys.status, "pending"),
          ),
        );
      throw cause;
    }
  }

  throw new AppError("RATE_LIMITED", "Idempotency request is being resolved; retry shortly");
}

type IdempotencyRow = typeof idempotencyKeys.$inferSelect;

function replayOrThrow(row: IdempotencyRow, method: string, path: string, requestHash: string): unknown {
  if (row.method !== method || row.path !== path || row.requestHash !== requestHash) {
    throw new AppError("IDEMPOTENCY_CONFLICT", "Idempotency key was already used for a different request");
  }
  if (row.status !== "completed") {
    throw new AppError("RATE_LIMITED", "Identical request is still being processed");
  }
  return row.responseBody;
}

function isUniqueViolation(cause: unknown): boolean {
  return typeof cause === "object" && cause !== null && "code" in cause && (cause as { code?: unknown }).code === "23505";
}
