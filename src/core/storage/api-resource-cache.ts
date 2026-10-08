import { z, type ZodType } from "zod";

import { createExpoSecureStorage } from "@/core/security/secure-storage/expo-secure-storage";
import type { SecureStorageKey } from "@/core/security/secure-storage/keys";
import { getAppDatabase } from "./database/app-database";

const CURRENT_SCOPE_KEY = "offline.currentUserId" satisfies SecureStorageKey;

const cacheRowSchema = z.object({
  payload_json: z.string(),
  cached_at: z.string(),
  server_updated_at: z.string().nullable(),
});

export interface CachedResource<T> {
  value: T;
  cachedAt: string;
  serverUpdatedAt: string | null;
}

/** Records the authenticated user whose server state may be read offline. */
export async function setOfflineUserScope(userId: string): Promise<void> {
  await createExpoSecureStorage().set(CURRENT_SCOPE_KEY, userId);
}

export async function getOfflineUserScope(): Promise<string | null> {
  return createExpoSecureStorage().get(CURRENT_SCOPE_KEY);
}

export async function readCachedResource<T>(
  cacheKey: string,
  schema: ZodType<T>,
): Promise<CachedResource<T> | null> {
  const scopeId = await getOfflineUserScope();
  if (!scopeId) return null;

  const db = await getAppDatabase();
  const rows = await db.query(
    `SELECT payload_json, cached_at, server_updated_at
       FROM api_resource_cache
      WHERE scope_id = ? AND cache_key = ?
      LIMIT 1`,
    [scopeId, cacheKey],
  );
  const row = cacheRowSchema.safeParse(rows[0]);
  if (!row.success) return null;

  let raw: unknown;
  try {
    raw = JSON.parse(row.data.payload_json);
  } catch {
    await removeCachedResource(cacheKey);
    return null;
  }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    await removeCachedResource(cacheKey);
    return null;
  }

  return {
    value: parsed.data,
    cachedAt: row.data.cached_at,
    serverUpdatedAt: row.data.server_updated_at,
  };
}

export async function writeCachedResource<T>(input: {
  cacheKey: string;
  resourceType: string;
  value: T;
  schema: ZodType<T>;
  serverUpdatedAt?: string | null;
  /** Needed only for /me, before a current offline scope exists. */
  scopeId?: string;
}): Promise<void> {
  const parsed = input.schema.parse(input.value);
  const scopeId = input.scopeId ?? (await getOfflineUserScope());
  if (!scopeId) return;

  const db = await getAppDatabase();
  await db.execute(
    `INSERT INTO api_resource_cache (
       scope_id, cache_key, resource_type, payload_json, server_updated_at, cached_at
     ) VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(scope_id, cache_key) DO UPDATE SET
       resource_type = excluded.resource_type,
       payload_json = excluded.payload_json,
       server_updated_at = excluded.server_updated_at,
       cached_at = excluded.cached_at`,
    [
      scopeId,
      input.cacheKey,
      input.resourceType,
      JSON.stringify(parsed),
      input.serverUpdatedAt ?? null,
      new Date().toISOString(),
    ],
  );
}

export async function removeCachedResource(cacheKey: string): Promise<void> {
  const scopeId = await getOfflineUserScope();
  if (!scopeId) return;
  const db = await getAppDatabase();
  await db.execute("DELETE FROM api_resource_cache WHERE scope_id = ? AND cache_key = ?", [
    scopeId,
    cacheKey,
  ]);
}

const listedCacheRowSchema = z.object({
  cache_key: z.string(),
  resource_type: z.string(),
  payload_json: z.string(),
  cached_at: z.string(),
});

export interface RawCachedResource {
  cacheKey: string;
  resourceType: string;
  payload: unknown;
  cachedAt: string;
}

/** Reads every server resource owned by the current user for startup hydration. */
export async function listCachedResources(): Promise<RawCachedResource[]> {
  const scopeId = await getOfflineUserScope();
  if (!scopeId) return [];
  const db = await getAppDatabase();
  const rows = await db.query(
    `SELECT cache_key, resource_type, payload_json, cached_at
       FROM api_resource_cache
      WHERE scope_id = ?
      ORDER BY cached_at ASC`,
    [scopeId],
  );

  const result: RawCachedResource[] = [];
  for (const candidate of rows) {
    const parsed = listedCacheRowSchema.safeParse(candidate);
    if (!parsed.success) continue;
    try {
      result.push({
        cacheKey: parsed.data.cache_key,
        resourceType: parsed.data.resource_type,
        payload: JSON.parse(parsed.data.payload_json),
        cachedAt: parsed.data.cached_at,
      });
    } catch {
      // Ignore corrupt cache rows; individual query fetches can repopulate them.
    }
  }
  return result;
}
