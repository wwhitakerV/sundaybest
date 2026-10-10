import { eq, inArray } from "drizzle-orm";

import type { ApiQuickChecks } from "../contracts/quick-checks.js";
import type { Database } from "../db/client.js";
import { planDays, plans, scriptureReferences, sermonSources } from "../db/schema.js";
import type { createQuizService } from "./quiz-service.js";

type QuizService = ReturnType<typeof createQuizService>;

/**
 * Every Quick Check the reader has finished, newest first — their latest
 * finished attempt at each — with the plan, day and passage it belongs to.
 */
export function createQuickChecksService(db: Database, quizService: QuizService) {
  return {
    async get(userId: string): Promise<ApiQuickChecks> {
      const finished = await quizService.listLatestCompleted(userId);
      const dayIds = finished.flatMap(({ quiz }) => (quiz.planDayId ? [quiz.planDayId] : []));
      const days =
        dayIds.length === 0
          ? []
          : await db
              .select({
                id: planDays.id,
                dayNumber: planDays.dayNumber,
                reference: scriptureReferences.canonicalReference,
                planTitle: plans.title,
                thumbnailUrl: sermonSources.thumbnailUrl,
              })
              .from(planDays)
              .innerJoin(plans, eq(plans.id, planDays.planId))
              .innerJoin(sermonSources, eq(sermonSources.id, plans.sermonId))
              .innerJoin(
                scriptureReferences,
                eq(scriptureReferences.id, planDays.scriptureReferenceId),
              )
              .where(inArray(planDays.id, dayIds));
      const byDay = new Map(days.map((day) => [day.id, day]));

      return {
        quickChecks: finished.flatMap(({ quiz, completedAt, questions }) => {
          const day = quiz.planDayId ? byDay.get(quiz.planDayId) : undefined;
          return day
            ? [
                {
                  quizId: quiz.id,
                  planId: quiz.planId,
                  planTitle: day.planTitle,
                  thumbnailUrl: day.thumbnailUrl,
                  dayNumber: day.dayNumber,
                  reference: day.reference,
                  completedAt: completedAt.toISOString(),
                  questions,
                },
              ]
            : [];
        }),
      };
    },
  };
}
