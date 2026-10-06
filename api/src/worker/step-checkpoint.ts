import { and, eq } from "drizzle-orm";

import type { Database } from "../db/client.js";
import { generationSteps } from "../db/schema.js";
import type { StepCheckpoint } from "../generation/pipeline.js";

/**
 * Keeps a generation's accepted steps in `generation_steps`, so a retried or
 * reclaimed job resumes from them. Plan content only, never anything about
 * the reader; deleted when the plan is published.
 */
export function generationCheckpoint(db: Database, generationId: string): StepCheckpoint {
  return {
    async load(step) {
      const [row] = await db.select({ output: generationSteps.output }).from(generationSteps)
        .where(and(eq(generationSteps.generationId, generationId), eq(generationSteps.step, step))).limit(1);
      return row?.output ?? null;
    },
    async save(step, output) {
      await db.insert(generationSteps).values({ generationId, step, output })
        .onConflictDoUpdate({ target: [generationSteps.generationId, generationSteps.step], set: { output, createdAt: new Date() } });
    },
  };
}
