import { asc, inArray } from "drizzle-orm";

import type { ApiWeekHistory, ApiWeeks } from "../contracts/weeks.js";
import type { Database } from "../db/client.js";
import { reflectionPrompts } from "../db/schema.js";
import { addCalendarDays, localDateInTimeZone, startOfWeekSunday } from "../domain/time.js";
import { getScheduledDays, type ScheduledDay } from "./week-service.js";

/**
 * Every week a plan ran in, up to this one, newest first — each with how
 * many of its days had study in them and its plans, newest sermon first:
 * their artwork, church, passages that week, and the reflection ids of the
 * days read, so the reader can find a week they half remember.
 */
export function createWeeksService(db: Database) {
  return {
    async get(userId: string, timezone: string): Promise<ApiWeeks> {
      const today = localDateInTimeZone(new Date(), timezone);
      const currentWeekStart = startOfWeekSunday(today);
      const days = (await getScheduledDays(db, userId, today)).filter(
        (day) => startOfWeekSunday(day.scheduledOn) <= currentWeekStart,
      );

      const read = days.filter((day) => day.status === "done");
      const prompts =
        read.length === 0
          ? []
          : await db
              .select({ id: reflectionPrompts.id, planDayId: reflectionPrompts.planDayId })
              .from(reflectionPrompts)
              .where(
                inArray(
                  reflectionPrompts.planDayId,
                  read.map((day) => day.planDayId),
                ),
              )
              .orderBy(asc(reflectionPrompts.position));
      const finishedOn = new Set(days.flatMap((day) => (day.completedOn ? [day.completedOn] : [])));

      const byWeek = new Map<string, ScheduledDay[]>();
      for (const day of days) {
        const week = startOfWeekSunday(day.scheduledOn);
        byWeek.set(week, [...(byWeek.get(week) ?? []), day]);
      }

      const weeks: ApiWeekHistory[] = [...byWeek.entries()]
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([weekStart, weekDays]) => ({
          weekStart,
          daysStudied: Array.from({ length: 7 }, (_, offset) =>
            addCalendarDays(weekStart, offset),
          ).filter((date) => finishedOn.has(date)).length,
          plans: toPlans(weekDays, prompts),
        }));

      return { currentWeekStart, weeks };
    },
  };
}

/** A week's days, as its plans: newest sermon first, each with its passages that week in order. */
function toPlans(
  days: readonly ScheduledDay[],
  prompts: readonly { id: string; planDayId: string }[],
): ApiWeekHistory["plans"] {
  const byPlan = new Map<string, ScheduledDay[]>();
  for (const day of days) byPlan.set(day.planId, [...(byPlan.get(day.planId) ?? []), day]);

  return [...byPlan.values()]
    .sort((a, b) => (b[0]?.planCreatedAt.getTime() ?? 0) - (a[0]?.planCreatedAt.getTime() ?? 0))
    .flatMap((planDays) => {
      const first = planDays[0];
      if (!first) return [];
      const ordered = [...planDays].sort((a, b) => a.dayNumber - b.dayNumber);
      const readIds = new Set(
        ordered.filter((day) => day.status === "done").map((day) => day.planDayId),
      );
      return [
        {
          planId: first.planId,
          title: first.planTitle,
          church: first.church,
          thumbnailUrl: first.thumbnailUrl,
          thumbnailColors: first.thumbnailColors,
          passages: ordered.map((day) => ({
            reference: day.scripture.canonicalReference,
            done: day.status === "done",
          })),
          reflectionIds: prompts
            .filter((prompt) => readIds.has(prompt.planDayId))
            .map((prompt) => prompt.id),
        },
      ];
    });
}
