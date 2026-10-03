import { and, eq } from "drizzle-orm";

import type { CreatePlanRequest } from "../contracts/plans.js";
import type { Database } from "../db/client.js";
import { generationJobs, planGenerations, plans, sermonSources, userPlanEnrollments } from "../db/schema.js";
import { AppError } from "../http/errors.js";

export function createGenerationService(db: Database) {
  return {
    async create(userId: string, input: CreatePlanRequest, requestKey: string) {
      const existing = await db
        .select({ planId: planGenerations.planId, generationId: planGenerations.id })
        .from(planGenerations)
        .where(and(eq(planGenerations.userId, userId), eq(planGenerations.requestKey, requestKey)))
        .limit(1);
      if (existing[0]) return existing[0];

      const sermon = await db.select().from(sermonSources).where(eq(sermonSources.id, input.sermonId)).limit(1);
      if (!sermon[0]) throw new AppError("NOT_FOUND", "Sermon not found");

      return db.transaction(async (tx) => {
        const [plan] = await tx
          .insert(plans)
          .values({
            ownerUserId: userId,
            sermonId: input.sermonId,
            title: sermon[0]!.title,
            visibility: "private",
            lengthDays: input.lengthDays,
            quickCheckEnabled: input.quickCheckEnabled,
          })
          .returning({ id: plans.id });
        if (!plan) throw new AppError("INTERNAL", "Could not create plan");

        await tx.insert(userPlanEnrollments).values({ userId, planId: plan.id, status: "ready" });
        const [generation] = await tx
          .insert(planGenerations)
          .values({
            userId,
            requestKey,
            planId: plan.id,
            sermonId: input.sermonId,
            requestedLength: input.lengthDays,
            quickCheckEnabled: input.quickCheckEnabled,
            status: "preparing",
          })
          .returning({ id: planGenerations.id });
        if (!generation) throw new AppError("INTERNAL", "Could not create generation");
        await tx.insert(generationJobs).values({ generationId: generation.id });
        return { planId: plan.id, generationId: generation.id };
      });
    },

    async get(userId: string, generationId: string) {
      const rows = await db
        .select()
        .from(planGenerations)
        .where(and(eq(planGenerations.id, generationId), eq(planGenerations.userId, userId)))
        .limit(1);
      if (!rows[0]) throw new AppError("NOT_FOUND", "Generation not found");
      return toGeneration(rows[0]);
    },

    async retry(userId: string, generationId: string) {
      const rows = await db
        .select()
        .from(planGenerations)
        .where(and(eq(planGenerations.id, generationId), eq(planGenerations.userId, userId)))
        .limit(1);
      const generation = rows[0];
      if (!generation) throw new AppError("NOT_FOUND", "Generation not found");
      if (generation.status !== "failed") throw new AppError("CONFLICT", "Only failed generations can be retried");

      const now = new Date();
      const [updated] = await db
        .update(planGenerations)
        .set({
          status: "preparing",
          attemptCount: generation.attemptCount + 1,
          errorCode: null,
          errorMessage: null,
          startedAt: null,
          finishedAt: null,
          updatedAt: now,
        })
        .where(eq(planGenerations.id, generation.id))
        .returning();
      await db
        .insert(generationJobs)
        .values({ generationId: generation.id, status: "queued", attempts: 0, availableAt: now })
        .onConflictDoUpdate({
          target: generationJobs.generationId,
          set: { status: "queued", attempts: 0, availableAt: now, lockedAt: null, lockedBy: null, lastError: null, updatedAt: now },
        });
      if (!updated) throw new AppError("INTERNAL");
      return toGeneration(updated);
    },
  };
}

export function toGeneration(row: typeof planGenerations.$inferSelect) {
  return {
    id: row.id,
    planId: row.planId,
    sermonId: row.sermonId,
    status: row.status,
    attempt: row.attemptCount,
    error: row.errorCode
      ? {
          code: normalizeGenerationErrorCode(row.errorCode),
          message: row.errorMessage ?? "Plan generation failed",
        }
      : null,
    startedAt: row.startedAt?.toISOString() ?? null,
    finishedAt: row.finishedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  } as const;
}

function normalizeGenerationErrorCode(value: string) {
  const allowed = ["invalidLink", "unsupportedSource", "videoUnavailable", "noCaptions", "network", "unknown"] as const;
  return allowed.find((item) => item === value) ?? "unknown";
}
