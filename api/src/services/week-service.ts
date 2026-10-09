import { and, asc, desc, eq, inArray, isNotNull, ne } from "drizzle-orm";

import type { ApiWeek, ApiWeekPassage } from "../contracts/week.js";
import type { Database } from "../db/client.js";
import {
  planDayProgress,
  planDays,
  plans,
  quizAnswers,
  quizAttempts,
  reflectionPrompts,
  scriptureReferences,
  sermonSources,
  userPlanEnrollments,
  userSettings,
} from "../db/schema.js";
import { addCalendarDays, localDateInTimeZone, startOfWeekSunday } from "../domain/time.js";
import type { BibleProvider } from "../providers/bible-provider.js";
import { loadScripture } from "./study-service.js";

/** A key verse reads whole in four lines of the app's Scripture face: about this many characters. */
const KEY_VERSE_CHARACTERS = 90;

/**
 * Progress's week: each of its days — studied or not, today, or still ahead
 * — and on each, one passage per plan scheduled on it, the newest sermon
 * first, with a key verse once it's done; the plans it holds; how far back
 * the reader can go; and their all-time figures.
 */
export function createWeekService(db: Database, bibleProvider: BibleProvider) {
  return {
    async get(userId: string, timezone: string, requestedWeekStart?: string): Promise<ApiWeek> {
      const today = localDateInTimeZone(new Date(), timezone);
      const weekStart = startOfWeekSunday(requestedWeekStart ?? today);
      const weekEnd = addCalendarDays(weekStart, 6);

      const [days, recall, settingsRows] = await Promise.all([
        getScheduledDays(db, userId, today),
        getRecall(db, userId),
        db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1),
      ]);
      const translation = settingsRows[0]?.bibleTranslation;

      const finishedOn = days.flatMap((day) => (day.completedOn ? [day.completedOn] : []));
      const inWeek = days.filter(
        (day) => day.scheduledOn >= weekStart && day.scheduledOn <= weekEnd,
      );
      const done = inWeek.filter((day) => day.status === "done");

      const [verses, prompts] = await Promise.all([
        Promise.all(
          done.map(async (day) => {
            if (!translation) return [day.planDayId, null] as const;
            const { verses: passage } = await loadScripture(
              db,
              bibleProvider,
              day.scripture,
              translation,
            );
            return [day.planDayId, pickKeyVerse(passage)] as const;
          }),
        ),
        done.length === 0
          ? Promise.resolve([])
          : db
              .select({ id: reflectionPrompts.id, planDayId: reflectionPrompts.planDayId })
              .from(reflectionPrompts)
              .where(
                inArray(
                  reflectionPrompts.planDayId,
                  done.map((day) => day.planDayId),
                ),
              )
              .orderBy(asc(reflectionPrompts.position)),
      ]);
      const verseByDay = new Map(verses);

      const toPassage = (day: ScheduledDay): ApiWeekPassage => ({
        planId: day.planId,
        planTitle: day.planTitle,
        dayNumber: day.dayNumber,
        reference: day.scripture.canonicalReference,
        status: day.status,
        keyVerse: verseByDay.get(day.planDayId) ?? null,
        reflectionIds: prompts
          .filter((prompt) => prompt.planDayId === day.planDayId)
          .map((prompt) => prompt.id),
      });

      const weekDays = Array.from({ length: 7 }, (_, offset) => {
        const date = addCalendarDays(weekStart, offset);
        const studied = finishedOn.includes(date);
        const state = studied
          ? "studied"
          : date === today
            ? "today"
            : date > today
              ? "upcoming"
              : "notStudied";
        const passages = inWeek
          .filter((day) => day.scheduledOn === date)
          .sort((a, b) => b.planCreatedAt.getTime() - a.planCreatedAt.getTime())
          .map(toPassage);
        return { date, state, passages } as const;
      });

      const weekPlans = [...new Map(inWeek.map((day) => [day.planId, day] as const)).values()];
      const only = weekPlans.length === 1 ? weekPlans[0] : undefined;
      const currentWeek = startOfWeekSunday(today);
      const byWeek = new Map<string, Map<string, { title: string; createdAt: Date }>>();
      for (const day of days) {
        const week = startOfWeekSunday(day.scheduledOn);
        if (week > currentWeek) continue;
        const plansInWeek =
          byWeek.get(week) ?? new Map<string, { title: string; createdAt: Date }>();
        plansInWeek.set(day.planId, { title: day.planTitle, createdAt: day.planCreatedAt });
        byWeek.set(week, plansInWeek);
      }
      const weeks = [...byWeek.entries()]
        .sort(([a], [b]) => b.localeCompare(a))
        .flatMap(([start, plansInWeek]) => {
          // Its newest sermon names it; the rest are counted.
          const newest = [...plansInWeek.values()].sort(
            (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
          )[0];
          return newest
            ? [{ weekStart: start, planCount: plansInWeek.size, title: newest.title }]
            : [];
        });
      const finished = days.filter((day) => day.completedOn !== null);

      return {
        today,
        weekStart,
        translation: translation ?? "BSB",
        weeks,
        header: {
          planCount: weekPlans.length,
          title: only?.planTitle ?? null,
          church: only?.church ?? null,
        },
        days: weekDays,
        summary: {
          passageCount: finished.length,
          bookCount: new Set(finished.map((day) => day.scripture.book)).size,
          right: recall.filter(Boolean).length,
          missed: recall.filter((answer) => !answer).length,
        },
      };
    },
  };
}

export type ScheduledDay = Awaited<ReturnType<typeof getScheduledDays>>[number];

/**
 * Every scheduled day of every plan the reader has started and not put away,
 * each with where it stands — done, open, waiting on the plan's day before
 * it, or still ahead — read as the plan itself reads its days.
 */
export async function getScheduledDays(db: Database, userId: string, today: string) {
  const rows = await db
    .select({
      planDayId: planDays.id,
      planId: plans.id,
      planTitle: plans.title,
      planCreatedAt: plans.createdAt,
      church: sermonSources.churchOrChannel,
      thumbnailUrl: sermonSources.thumbnailUrl,
      thumbnailColors: sermonSources.thumbnailColors,
      dayNumber: planDays.dayNumber,
      enrollmentId: userPlanEnrollments.id,
      scheduledOn: planDayProgress.scheduledOn,
      startedAt: planDayProgress.startedAt,
      completedAt: planDayProgress.completedAt,
      completedOn: planDayProgress.completedLocalDate,
      scripture: scriptureReferences,
    })
    .from(planDayProgress)
    .innerJoin(userPlanEnrollments, eq(userPlanEnrollments.id, planDayProgress.enrollmentId))
    .innerJoin(planDays, eq(planDays.id, planDayProgress.planDayId))
    .innerJoin(plans, eq(plans.id, planDays.planId))
    .innerJoin(sermonSources, eq(sermonSources.id, plans.sermonId))
    .innerJoin(scriptureReferences, eq(scriptureReferences.id, planDays.scriptureReferenceId))
    .where(and(eq(userPlanEnrollments.userId, userId), ne(userPlanEnrollments.status, "archived")))
    .orderBy(asc(userPlanEnrollments.id), asc(planDays.dayNumber));

  // Walk each plan's days in order: a day after an unfinished one waits for it.
  let enrollment: string | null = null;
  let priorIncomplete = false;
  return rows.map((row) => {
    if (row.enrollmentId !== enrollment) {
      enrollment = row.enrollmentId;
      priorIncomplete = false;
    }
    const status: ApiWeekPassage["status"] = row.completedAt
      ? "done"
      : row.scheduledOn > today
        ? "upcoming"
        : row.startedAt || !priorIncomplete
          ? "open"
          : "waiting";
    if (!row.completedAt) priorIncomplete = true;
    return { ...row, status };
  });
}

/**
 * Every answer from each finished Quick Check's latest attempt — a retake
 * replaces rather than adds — oldest first: right or not.
 */
async function getRecall(db: Database, userId: string): Promise<boolean[]> {
  const attempts = await db
    .select({ id: quizAttempts.id, quizId: quizAttempts.quizId })
    .from(quizAttempts)
    .where(
      and(
        eq(quizAttempts.userId, userId),
        eq(quizAttempts.status, "completed"),
        isNotNull(quizAttempts.completedAt),
      ),
    )
    .orderBy(desc(quizAttempts.completedAt));
  const latest = new Map<string, string>();
  for (const attempt of attempts)
    if (!latest.has(attempt.quizId)) latest.set(attempt.quizId, attempt.id);
  if (latest.size === 0) return [];

  const answers = await db
    .select({ correct: quizAnswers.correct })
    .from(quizAnswers)
    .where(inArray(quizAnswers.attemptId, [...latest.values()]))
    .orderBy(asc(quizAnswers.answeredAt));
  return answers.map((answer) => answer.correct);
}

/**
 * The key verse of a passage: the first that reads whole in four lines, or —
 * when none is that short — the shortest. Never cut.
 */
export function pickKeyVerse(
  verses: readonly { number: number; text: string }[],
): { number: number; text: string } | null {
  const fits = verses.find((verse) => verse.text.trim().length <= KEY_VERSE_CHARACTERS);
  if (fits) return { number: fits.number, text: fits.text.trim() };
  const shortest = [...verses].sort((a, b) => a.text.length - b.text.length)[0];
  return shortest ? { number: shortest.number, text: shortest.text.trim() } : null;
}
