import { and, eq, inArray, lt, ne, notInArray, sql } from "drizzle-orm";

import type { Database } from "../db/client.js";
import { generationJobs, planGenerations } from "../db/schema.js";

/** How long a plan waits on another reader's build of the same sermon and length before writing its own. */
const LONGEST_WAIT_MS = 5 * 60_000;
/** How soon a waiting plan looks again. */
const LOOK_AGAIN_MS = 15_000;

interface Waiting {
  id: string;
  sermonId: string;
  requestedLength: number;
  userId: string;
  createdAt: Date;
}

/**
 * Whether another reader's build of the same sermon and length, asked for
 * earlier, is still under way: then this plan waits and copies it when it's
 * done, rather than paying for the same plan twice. Only the later of two
 * waits, so they never wait on each other, and none waits longer than
 * LONGEST_WAIT_MS: a build stuck or failing never holds another up for good.
 */
export async function buildUnderWay(db: Database, generation: Waiting): Promise<boolean> {
  if (Date.now() - generation.createdAt.getTime() > LONGEST_WAIT_MS) return false;
  const [other] = await db.select({ id: planGenerations.id }).from(planGenerations)
    .innerJoin(generationJobs, eq(generationJobs.generationId, planGenerations.id))
    .where(and(
      eq(planGenerations.sermonId, generation.sermonId),
      eq(planGenerations.requestedLength, generation.requestedLength),
      ne(planGenerations.userId, generation.userId),
      ne(planGenerations.id, generation.id),
      lt(planGenerations.createdAt, generation.createdAt),
      notInArray(planGenerations.status, ["completed", "failed"]),
      inArray(generationJobs.status, ["queued", "running"]),
    ))
    .limit(1);
  return other !== undefined;
}

/** Puts a claimed job back to look again shortly. Waiting isn't an attempt, so it doesn't count toward the job's retries. */
export async function lookAgainSoon(db: Database, jobId: string, workerId: string): Promise<void> {
  await db.update(generationJobs)
    .set({ status: "queued", availableAt: new Date(Date.now() + LOOK_AGAIN_MS), attempts: sql`${generationJobs.attempts} - 1`, lockedAt: null, lockedBy: null, updatedAt: new Date() })
    .where(and(eq(generationJobs.id, jobId), eq(generationJobs.status, "running"), eq(generationJobs.lockedBy, workerId)));
}
