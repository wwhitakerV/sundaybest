import { asc, inArray } from "drizzle-orm";

import type { ApiReflections } from "../contracts/reflections.js";
import type { Database } from "../db/client.js";
import { reflectionPrompts } from "../db/schema.js";
import { localDateInTimeZone } from "../domain/time.js";
import { getScheduledDays } from "./week-service.js";

/**
 * Every reflection question in the reader's plans — what was asked, its
 * passage, its study — for their phone to match with what they wrote, which
 * never leaves it.
 */
export function createReflectionsService(db: Database) {
  return {
    async get(userId: string, timezone: string): Promise<ApiReflections> {
      const today = localDateInTimeZone(new Date(), timezone);
      const days = await getScheduledDays(db, userId, today);
      if (days.length === 0) return { prompts: [] };

      const byDay = new Map(days.map((day) => [day.planDayId, day]));
      const rows = await db
        .select({
          id: reflectionPrompts.id,
          planDayId: reflectionPrompts.planDayId,
          question: reflectionPrompts.question,
        })
        .from(reflectionPrompts)
        .where(inArray(reflectionPrompts.planDayId, [...byDay.keys()]))
        .orderBy(asc(reflectionPrompts.position));

      return {
        prompts: rows.flatMap((row) => {
          const day = byDay.get(row.planDayId);
          return day
            ? [
                {
                  id: row.id,
                  question: row.question,
                  reference: day.scripture.canonicalReference,
                  planId: day.planId,
                  planTitle: day.planTitle,
                  dayNumber: day.dayNumber,
                },
              ]
            : [];
        }),
      };
    },
  };
}
