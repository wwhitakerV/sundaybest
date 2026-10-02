import { planOverviewHref } from "@/entities/plan";
import { useModalSession } from "@/hooks/use-modal-session";
import {
  getPlanDay,
  getPlanProgress,
  getReminder,
  getStreak,
  getWeeklyCompletionCounts,
  useAppSelector,
  useToday,
} from "@/core/store";
import { describeStreak, describeUpNextTime } from "../logic/day-complete";
import { getNextDayToStudy } from "../logic/next-day";
import { useStudyRoute } from "./use-study-route";

/**
 * Day Complete's view model: the day just done — its Quick Check, if it had
 * one, taken first — the streak it keeps going, the week so far, what's up
 * next (the next day's reading, and when), and Done!, which leaves the
 * session for the plan's overview.
 */
export function useDayComplete() {
  const session = useModalSession();
  const today = useToday();
  const { planId, dayNumber, day } = useStudyRoute();
  const progress = useAppSelector((state) => (day ? getPlanProgress(state, planId) : null));
  const streak = useAppSelector((state) => getStreak(state, today).current);
  const week = useAppSelector((state) => getWeeklyCompletionCounts(state, today));
  const reminder = useAppSelector((state) => getReminder(state, "dailyStudy"));
  const nextDay = progress ? getNextDayToStudy(progress, dayNumber) : undefined;
  const next = useAppSelector((state) =>
    nextDay !== undefined ? getPlanDay(state, planId, nextDay) : null,
  );

  if (!progress) return { found: false } as const;

  return {
    found: true,
    dayNumber,
    today,
    streakLabel: describeStreak(streak),
    week,
    upNext: next ? { title: next.reading.title, when: describeUpNextTime(reminder) } : null,
    done: () => session.exitTo(planOverviewHref(planId)),
  } as const;
}
