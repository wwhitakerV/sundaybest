import { and, eq, ne, sql } from "drizzle-orm";

import type { Database } from "../db/client.js";
import { planGenerations } from "../db/schema.js";
import type { StageEvent } from "../generation/pipeline.js";
import { generationProgress, type BuildProgress } from "./generation-progress.js";

type Status = BuildProgress["status"];

/**
 * Keeps a build's status and progress true to what the pipeline has done, for
 * the app's generation bar: the Scripture step while the plan is outlined,
 * writing as days are written, building quizzes as quizzes are. Days finish in
 * parallel and in any order, so progress is never written lower than it is.
 */
export function buildTracker(db: Database, build: { id: string; lengthDays: number; quickCheckEnabled: boolean }) {
  let daysWritten = 0;
  let quizzesWritten = 0;

  async function stage(status: Status, extra: { startedAt?: Date } = {}): Promise<void> {
    const progress = generationProgress({ status, lengthDays: build.lengthDays, quickCheckEnabled: build.quickCheckEnabled, daysWritten, quizzesWritten });
    await db
      .update(planGenerations)
      .set({ status, progress: sql`greatest(${planGenerations.progress}, ${progress})`, updatedAt: new Date(), ...extra })
      .where(and(eq(planGenerations.id, build.id), ne(planGenerations.status, "completed")));
  }

  return {
    stage,
    /** The days are already written: a reused plan getting only its quizzes. */
    daysAlreadyWritten() {
      daysWritten = build.lengthDays;
    },
    async observe(event: StageEvent): Promise<void> {
      if (event.outcome === "rejected") return;
      if (event.kind === "outline") return stage("writingDays");
      if (event.kind === "day") {
        daysWritten++;
        return stage(build.quickCheckEnabled && daysWritten >= build.lengthDays ? "buildingQuiz" : "writingDays");
      }
      quizzesWritten++;
      return stage("buildingQuiz");
    },
  };
}
