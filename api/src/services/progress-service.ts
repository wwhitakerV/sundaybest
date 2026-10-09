import { and, asc, eq, isNotNull } from "drizzle-orm";

import type { ApiProgress } from "../contracts/progress.js";
import type { Database } from "../db/client.js";
import { planDayProgress, userPlanEnrollments } from "../db/schema.js";
import { addCalendarDays, localDateInTimeZone, startOfWeekSunday } from "../domain/time.js";

/** The reader's week: which days had a finished plan day in them, and their streak. */
export function createProgressService(db: Database) {
  return {
    async get(userId: string, timezone: string, requestedWeekStart?: string) {
      const today = localDateInTimeZone(new Date(), timezone);
      const weekStart = requestedWeekStart ?? startOfWeekSunday(today);

      const rows = await db
        .select({ completedOn: planDayProgress.completedLocalDate })
        .from(planDayProgress)
        .innerJoin(userPlanEnrollments, eq(userPlanEnrollments.id, planDayProgress.enrollmentId))
        .where(
          and(
            eq(userPlanEnrollments.userId, userId),
            isNotNull(planDayProgress.completedAt),
            isNotNull(planDayProgress.completedLocalDate),
          ),
        )
        .orderBy(asc(planDayProgress.completedLocalDate));
      const completed = rows.flatMap((row) => (row.completedOn ? [row.completedOn] : []));

      const week = Array.from({ length: 7 }, (_, offset) => {
        const date = addCalendarDays(weekStart, offset);
        return { date, completedDayCount: completed.filter((day) => day === date).length };
      });

      const result: ApiProgress = {
        today,
        weekStart,
        week,
        streak: getStreak(completed, today),
      };
      return result;
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
