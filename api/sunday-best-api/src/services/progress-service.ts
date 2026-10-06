import { and, asc, desc, eq, isNotNull } from "drizzle-orm";

import type { ApiProgress } from "../contracts/progress.js";
import type { Database } from "../db/client.js";
import {
  planDayProgress,
  quizAnswers,
  quizAttempts,
  quizQuestions,
  userPlanEnrollments,
} from "../db/schema.js";
import { addCalendarDays, localDateInTimeZone, startOfWeekSunday } from "../domain/time.js";
import { createPlanService } from "./plan-service.js";

export function createProgressService(db: Database) {
  const planService = createPlanService(db);

  return {
    async get(userId: string, timezone: string, requestedWeekStart?: string) {
      const today = localDateInTimeZone(new Date(), timezone);
      const weekStart = requestedWeekStart ?? startOfWeekSunday(today);

      const completedRows = await db
        .select({
          completedLocalDate: planDayProgress.completedLocalDate,
        })
        .from(planDayProgress)
        .innerJoin(
          userPlanEnrollments,
          eq(userPlanEnrollments.id, planDayProgress.enrollmentId),
        )
        .where(
          and(
            eq(userPlanEnrollments.userId, userId),
            isNotNull(planDayProgress.completedAt),
            isNotNull(planDayProgress.completedLocalDate),
          ),
        )
        .orderBy(asc(planDayProgress.completedLocalDate));

      const completedDates = completedRows.flatMap((row) =>
        row.completedLocalDate ? [row.completedLocalDate] : [],
      );
      const distinctDates = [...new Set(completedDates)];

      const week = Array.from({ length: 7 }, (_, offset) => {
        const date = addCalendarDays(weekStart, offset);
        return {
          date,
          completedDayCount: completedDates.filter((candidate) => candidate === date).length,
        };
      });

      const completedPlans = await db
        .select({ id: userPlanEnrollments.id })
        .from(userPlanEnrollments)
        .where(
          and(
            eq(userPlanEnrollments.userId, userId),
            eq(userPlanEnrollments.status, "completed"),
          ),
        );

      const latestAttemptRows = await db
        .select()
        .from(quizAttempts)
        .where(
          and(
            eq(quizAttempts.userId, userId),
            eq(quizAttempts.status, "completed"),
            isNotNull(quizAttempts.completedAt),
          ),
        )
        .orderBy(desc(quizAttempts.completedAt))
        .limit(1);
      const latestAttempt = latestAttemptRows[0];

      let latestQuickCheck: ApiProgress["latestQuickCheck"] = null;
      if (latestAttempt?.completedAt) {
        const [questions, answers] = await Promise.all([
          db
            .select({ id: quizQuestions.id })
            .from(quizQuestions)
            .where(eq(quizQuestions.quizId, latestAttempt.quizId)),
          db
            .select({ correct: quizAnswers.correct })
            .from(quizAnswers)
            .where(eq(quizAnswers.attemptId, latestAttempt.id)),
        ]);
        if (questions.length > 0) {
          const correct = answers.filter((answer) => answer.correct).length;
          latestQuickCheck = {
            attemptId: latestAttempt.id,
            quizId: latestAttempt.quizId,
            correct,
            total: questions.length,
            percentage: Math.round((correct / questions.length) * 100),
            completedAt: latestAttempt.completedAt.toISOString(),
          };
        }
      }

      const activeEnrollmentRows = await db
        .select({ planId: userPlanEnrollments.planId })
        .from(userPlanEnrollments)
        .where(
          and(
            eq(userPlanEnrollments.userId, userId),
            eq(userPlanEnrollments.status, "active"),
          ),
        )
        .orderBy(desc(userPlanEnrollments.startedAt))
        .limit(1);
      const activePlanId = activeEnrollmentRows[0]?.planId ?? null;

      let upNext: ApiProgress["upNext"] = null;
      if (activePlanId) {
        const plan = await planService.getSummary(userId, activePlanId, timezone);
        if (plan.currentDay) {
          const scheduled = plan.currentDay.scheduledOn;
          const date = scheduled && scheduled > today ? scheduled : today;
          upNext = {
            plan,
            day: {
              id: plan.currentDay.id,
              dayNumber: plan.currentDay.dayNumber,
              title: plan.currentDay.title,
              estimatedMinutes: plan.currentDay.estimatedMinutes,
              scheduledOn: plan.currentDay.scheduledOn,
            },
            date,
          };
        }
      }

      return {
        today,
        weekStart,
        week,
        streak: getStreak(distinctDates, today),
        totals: {
          completedDayCount: completedRows.length,
          completedPlanCount: completedPlans.length,
        },
        latestQuickCheck,
        upNext,
      };
    },
  };
}

export function getStreak(dates: readonly string[], today: string) {
  const studied = new Set(dates);
  let longest = 0;

  for (const date of studied) {
    if (studied.has(addCalendarDays(date, -1))) continue;
    let run = 1;
    while (studied.has(addCalendarDays(date, run))) run += 1;
    longest = Math.max(longest, run);
  }

  let current = 0;
  let cursor = studied.has(today) ? today : addCalendarDays(today, -1);
  while (studied.has(cursor)) {
    current += 1;
    cursor = addCalendarDays(cursor, -1);
  }

  return { current, longest };
}
