import { http, HttpResponse } from "msw";

import {
  progressResponseSchema,
  weekResponseSchema,
  type ApiProgress,
  type ApiWeek,
} from "@/core/api/contracts";
import { API_URL, aReminder } from "./api";
import { aPlan, summaryOf } from "./api-plans";
import { server } from "../mocks/server";

/** "Today" for the progress fixtures: Wednesday 23 September 2026. */
export const PROGRESS_TODAY = "2026-09-23";
/** The same moment for a fake clock, mid-morning so no timezone moves the date. */
export const PROGRESS_NOW = new Date("2026-09-23T10:00:00");

/** The plan under way in the fixtures: six days, the first done. */
export const PLAN_UNDER_WAY = aPlan({
  seed: 21,
  title: "Today I Choose to Be a Blessing",
  lengthDays: 6,
  completedDays: 1,
});

/**
 * The days something was finished: yesterday, and every day of a seven-day
 * plan from Sun 30 Aug to Sat 5 Sep.
 */
const STUDIED = new Set([
  "2026-09-22",
  "2026-08-30",
  "2026-08-31",
  "2026-09-01",
  "2026-09-02",
  "2026-09-03",
  "2026-09-04",
  "2026-09-05",
]);

function addDays(date: string, days: number): string {
  const at = new Date(`${date}T12:00:00.000Z`);
  at.setUTCDate(at.getUTCDate() + days);
  return at.toISOString().slice(0, 10);
}

/** The Sunday a date's week starts on. */
function sundayOf(date: string): string {
  return addDays(date, -new Date(`${date}T12:00:00.000Z`).getUTCDay());
}

/** A week's progress, as `/v1/me/progress` returns it for `weekStart`. */
export function aProgress(weekStart: string, overrides: Partial<ApiProgress> = {}): ApiProgress {
  const current = PLAN_UNDER_WAY.days[1];
  return progressResponseSchema.parse({
    today: PROGRESS_TODAY,
    weekStart,
    week: Array.from({ length: 7 }, (_, index) => {
      const date = addDays(weekStart, index);
      return { date, completedDayCount: STUDIED.has(date) ? 1 : 0 };
    }),
    streak: { current: 1, longest: 7 },
    totals: { completedDayCount: 8, completedPlanCount: 1 },
    latestQuickCheck: {
      attemptId: "00000000-0000-4000-8000-0000000000e1",
      quizId: "00000000-0000-4000-8000-0000000000e2",
      correct: 1,
      total: 2,
      percentage: 50,
      completedAt: "2026-09-22T09:00:00.000Z",
    },
    upNext: current
      ? {
          plan: summaryOf(PLAN_UNDER_WAY),
          day: {
            id: current.id,
            dayNumber: current.dayNumber,
            title: current.reading.title,
            estimatedMinutes: current.estimatedMinutes,
            scheduledOn: PROGRESS_TODAY,
          },
          date: PROGRESS_TODAY,
        }
      : null,
    ...overrides,
  });
}

/**
 * A week of study, as `/v1/me/week` returns it for `weekStart`: the fixtures'
 * studied days done, today, the days ahead, and the plan under way in its
 * header. No passages, and no Quick Check answered yet.
 */
export function aWeekOfStudy(weekStart: string, overrides: Partial<ApiWeek> = {}): ApiWeek {
  return weekResponseSchema.parse({
    today: PROGRESS_TODAY,
    weekStart,
    translation: "BSB",
    weeks: [{ weekStart: sundayOf(PROGRESS_TODAY), planCount: 1, title: PLAN_UNDER_WAY.title }],
    header: { planCount: 1, title: PLAN_UNDER_WAY.title, church: null },
    days: Array.from({ length: 7 }, (_, index) => {
      const date = addDays(weekStart, index);
      const state =
        date === PROGRESS_TODAY
          ? "today"
          : date > PROGRESS_TODAY
            ? "upcoming"
            : STUDIED.has(date)
              ? "studied"
              : "notStudied";
      return { date, state, passages: [] };
    }),
    summary: { passageCount: STUDIED.size, bookCount: 1, right: 0, missed: 0 },
    ...overrides,
  });
}

/**
 * Serves the reader's progress and their week of study, a week at a time for
 * whichever week is asked for, and their daily reminder (on, at 6:30 AM).
 * Returns the weeks asked for.
 */
export function serveProgress(
  overrides: Partial<ApiProgress> = {},
  weekOverrides: Partial<ApiWeek> = {},
): string[] {
  const asked: string[] = [];
  server.use(
    http.get(`${API_URL}/v1/me/progress`, ({ request }) => {
      const weekStart =
        new URL(request.url).searchParams.get("weekStart") ?? sundayOf(PROGRESS_TODAY);
      asked.push(weekStart);
      return HttpResponse.json(aProgress(weekStart, overrides));
    }),
    http.get(`${API_URL}/v1/me/week`, ({ request }) => {
      const weekStart =
        new URL(request.url).searchParams.get("weekStart") ?? sundayOf(PROGRESS_TODAY);
      asked.push(weekStart);
      return HttpResponse.json(aWeekOfStudy(weekStart, weekOverrides));
    }),
    http.get(`${API_URL}/v1/me/reminders`, () => HttpResponse.json({ reminders: [aReminder()] })),
  );
  return asked;
}
