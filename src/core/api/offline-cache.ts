import type { ZodType } from "zod";

import { isApiError } from "./api-error";
import {
  getOfflineUserScope,
  readCachedResource,
  removeCachedResource,
  setOfflineUserScope,
  writeCachedResource,
} from "@/core/storage/api-resource-cache";

export const offlineCacheKeys = {
  me: "me",
  settings: "settings",
  reminders: "reminders",
  plans: "plans",
  plan: (planId: string) => `plan:${planId}`,
  progress: (weekStart: string) => `progress:${weekStart}`,
  studyDay: (planId: string, dayNumber: number) => `study:${planId}:${dayNumber}`,
  quizSession: (quizId: string) => `quiz:${quizId}`,
} as const;

export async function cachedServerQuery<T>(input: {
  cacheKey: string;
  resourceType: string;
  schema: ZodType<T>;
  fetcher: () => Promise<T>;
  serverUpdatedAt?: (value: T) => string | null | undefined;
  /** Allows provider/licensing rules to forbid durable storage of a response. */
  cacheable?: (value: T) => boolean;
}): Promise<T> {
  try {
    const value = await input.fetcher();
    if (input.cacheable?.(value) === false) {
      try {
        await removeCachedResource(input.cacheKey);
      } catch {
        // A licensing-driven cache delete is best effort; never fail the network read.
      }
    } else {
      await safeWrite({
        cacheKey: input.cacheKey,
        resourceType: input.resourceType,
        value,
        schema: input.schema,
        serverUpdatedAt: input.serverUpdatedAt?.(value) ?? null,
      });
    }
    return value;
  } catch (cause) {
    if (!canUseOfflineFallback(cause)) throw cause;
    const cached = await safeRead(input.cacheKey, input.schema);
    if (!cached) throw cause;
    return cached;
  }
}

/**
 * /me establishes the cache ownership boundary. It is the only server resource
 * that is allowed to create/change the current offline scope.
 */
export async function cachedCurrentUserQuery<T extends { user: { id: string } }>(input: {
  schema: ZodType<T>;
  fetcher: () => Promise<T>;
}): Promise<T> {
  try {
    const value = await input.fetcher();
    await setOfflineUserScope(value.user.id);
    await safeWrite({
      cacheKey: offlineCacheKeys.me,
      resourceType: "me",
      value,
      schema: input.schema,
      scopeId: value.user.id,
    });
    return value;
  } catch (cause) {
    if (!canUseOfflineFallback(cause)) throw cause;
    const scopeId = await getOfflineUserScope();
    if (!scopeId) throw cause;
    const cached = await safeRead(offlineCacheKeys.me, input.schema);
    if (!cached) throw cause;
    return cached;
  }
}

export async function persistServerCache<T>(input: {
  cacheKey: string;
  resourceType: string;
  schema: ZodType<T>;
  value: T | undefined;
  serverUpdatedAt?: string | null;
}): Promise<void> {
  if (input.value === undefined) return;
  await safeWrite({
    cacheKey: input.cacheKey,
    resourceType: input.resourceType,
    value: input.value,
    schema: input.schema,
    serverUpdatedAt: input.serverUpdatedAt ?? null,
  });
}

export function isOfflineTransportFailure(cause: unknown): boolean {
  return (
    isApiError(cause) &&
    (cause.kind === "network" || cause.kind === "timeout")
  );
}

function canUseOfflineFallback(cause: unknown): boolean {
  return (
    isApiError(cause) &&
    (cause.kind === "network" || cause.kind === "timeout" || cause.kind === "server")
  );
}

async function safeRead<T>(cacheKey: string, schema: ZodType<T>): Promise<T | null> {
  try {
    return (await readCachedResource(cacheKey, schema))?.value ?? null;
  } catch {
    return null;
  }
}

async function safeWrite<T>(input: {
  cacheKey: string;
  resourceType: string;
  value: T;
  schema: ZodType<T>;
  serverUpdatedAt?: string | null;
  scopeId?: string;
}): Promise<void> {
  try {
    await writeCachedResource(input);
  } catch {
    // Cache writes never turn a successful server request into a user-visible failure.
  }
}
