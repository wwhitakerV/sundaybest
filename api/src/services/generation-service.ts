import { and, desc, eq, isNull, ne } from "drizzle-orm";

import type { CreatePlanRequest } from "../contracts/plans.js";
import type { Database } from "../db/client.js";
import {
  generationJobs,
  planGenerations,
  plans,
  sermonSources,
  userPlanEnrollments,
  users,
} from "../db/schema.js";
import { AppError } from "../http/errors.js";

/** The most builds the generation bar lists at once. */
const CURRENT_LIMIT = 10;

export function createGenerationService(db: Database) {
  async function getContext(userId: string, generationId: string) {
    const rows = await db
      .select({ generation: planGenerations, planTitle: plans.title })
      .from(planGenerations)
      .innerJoin(plans, eq(plans.id, planGenerations.planId))
      .where(
        and(
          eq(planGenerations.id, generationId),
          eq(planGenerations.userId, userId),
        ),
      )
      .limit(1);

    const row = rows[0];
    if (!row) throw new AppError("NOT_FOUND", "Generation not found");
    return row;
  }

  return {
    async create(userId: string, input: CreatePlanRequest, requestKey: string) {
      const existing = await db
        .select({ planId: planGenerations.planId, generationId: planGenerations.id })
        .from(planGenerations)
        .where(
          and(
            eq(planGenerations.userId, userId),
            eq(planGenerations.requestKey, requestKey),
          ),
        )
        .limit(1);
      if (existing[0]) return existing[0];

      const sermon = await db
        .select()
        .from(sermonSources)
        .where(eq(sermonSources.id, input.sermonId))
        .limit(1);
      if (!sermon[0]) throw new AppError("NOT_FOUND", "Sermon not found");

      return db.transaction(async (tx) => {
        // One plan per sermon per reader: asking again opens the plan they
        // have. One that failed to build does not count. Locking the reader
        // serializes their creates, so two taps cannot both start one.
        await tx.select({ id: users.id }).from(users).where(eq(users.id, userId)).for("update");
        const [owned] = await tx
          .select({ planId: planGenerations.planId, generationId: planGenerations.id })
          .from(planGenerations)
          .where(and(
            eq(planGenerations.userId, userId),
            eq(planGenerations.sermonId, input.sermonId),
            ne(planGenerations.status, "failed"),
          ))
          .orderBy(desc(planGenerations.createdAt))
          .limit(1);
        if (owned) {
          // Shown again in the app's generation bar, so asking again opens it.
          await tx.update(planGenerations).set({ dismissedAt: null }).where(eq(planGenerations.id, owned.generationId));
          return owned;
        }

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

        await tx.insert(userPlanEnrollments).values({
          userId,
          planId: plan.id,
          status: "ready",
        });

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
      const row = await getContext(userId, generationId);
      return toGeneration(row.generation, row.planTitle);
    },

    /** The reader's builds not yet dismissed — building, ready, or failed — newest first. */
    async listCurrent(userId: string) {
      const rows = await db
        .select({ generation: planGenerations, planTitle: plans.title })
        .from(planGenerations)
        .innerJoin(plans, eq(plans.id, planGenerations.planId))
        .where(and(eq(planGenerations.userId, userId), isNull(planGenerations.dismissedAt)))
        .orderBy(desc(planGenerations.createdAt))
        .limit(CURRENT_LIMIT);
      return rows.map((row) => toGeneration(row.generation, row.planTitle));
    },

    /** Takes a build out of the generation bar. It keeps building; dismissing twice is harmless. */
    async dismiss(userId: string, generationId: string) {
      const row = await getContext(userId, generationId);
      if (row.generation.dismissedAt) return toGeneration(row.generation, row.planTitle);
      const [updated] = await db.update(planGenerations).set({ dismissedAt: new Date() })
        .where(eq(planGenerations.id, generationId)).returning();
      return toGeneration(updated ?? row.generation, row.planTitle);
    },

    async retry(userId: string, generationId: string) {
      const row = await getContext(userId, generationId);
      const generation = row.generation;

      if (generation.status !== "failed") {
        throw new AppError("CONFLICT", "Only failed generations can be retried");
      }

      const now = new Date();
      return db.transaction(async (tx) => {
        const [updated] = await tx
          .update(planGenerations)
          .set({
            status: "preparing",
            attemptCount: generation.attemptCount + 1,
            progress: 0,
            dismissedAt: null,
            errorCode: null,
            errorMessage: null,
            startedAt: null,
            finishedAt: null,
            updatedAt: now,
          })
          .where(and(eq(planGenerations.id, generation.id), eq(planGenerations.status, "failed")))
          .returning();
  
        if (!updated) throw new AppError("CONFLICT", "Generation was already retried");
  
        await tx
          .insert(generationJobs)
          .values({
            generationId: generation.id,
            status: "queued",
            attempts: 0,
            availableAt: now,
          })
          .onConflictDoUpdate({
            target: generationJobs.generationId,
            set: {
              status: "queued",
              attempts: 0,
              availableAt: now,
              lockedAt: null,
              lockedBy: null,
              lastError: null,
              updatedAt: now,
            },
          });
  
        return toGeneration(updated, row.planTitle);
      });
    },
  };
}

export function toGeneration(
  row: typeof planGenerations.$inferSelect,
  planTitle: string,
) {
  return {
    id: row.id,
    planId: row.planId,
    sermonId: row.sermonId,
    planTitle,
    requestedLength: asPlanLength(row.requestedLength),
    quickCheckEnabled: row.quickCheckEnabled,
    status: row.status,
    progress: row.progress,
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

function asPlanLength(value: number): 1 | 2 | 3 | 4 | 5 | 6 | 7 {
  switch (value) {
    case 1:
    case 2:
    case 3:
    case 4:
    case 5:
    case 6:
    case 7:
      return value;
    default:
      throw new AppError("INTERNAL", "Invalid plan length");
  }
}

function normalizeGenerationErrorCode(value: string) {
  const allowed = [
    "invalidLink",
    "unsupportedSource",
    "videoUnavailable",
    "noCaptions",
    "network",
    "unknown",
  ] as const;
  return allowed.find((item) => item === value) ?? "unknown";
}
