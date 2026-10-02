import { useState } from "react";
import { useRouter } from "expo-router";

import { planOverviewHref } from "@/entities/plan";
import { selectionFeedback } from "@/core/haptics/haptics";
import {
  getDayMinutes,
  getLatestQuizScore,
  getPlanProgress,
  getProgressTotals,
  getReminder,
  getStreak,
  getUpNext,
  getWeeklyCompletionCounts,
  useAppSelector,
  useToday,
} from "@/core/store";
import { addDays } from "@/utils/dates/addDays";
import { getWeekTitle } from "../logic/week";

/**
 * Progress's view model: the week shown (this one, or one before), its days
 * and title, the streak and totals, the latest Quick Check score, and what's
 * up next — with its time, how far through its plan is, and the reminder.
 */
export function useProgressWeek() {
  const router = useRouter();
  const today = useToday();
  // Which week is shown: 0 is this one, -1 the one before, and so on.
  const [weekOffset, setWeekOffset] = useState(0);
  const week = useAppSelector((state) =>
    getWeeklyCompletionCounts(state, addDays(today, weekOffset * 7)),
  );
  const streak = useAppSelector((state) => getStreak(state, today));
  const totals = useAppSelector(getProgressTotals);
  const quizScore = useAppSelector(getLatestQuizScore);
  const next = useAppSelector((state) => getUpNext(state, today));
  const nextDetail = useAppSelector((state) =>
    next
      ? {
          minutes: getDayMinutes(state, next.day.id),
          percent: getPlanProgress(state, next.plan.id)?.completionPercentage ?? 0,
        }
      : null,
  );
  const reminder = useAppSelector((state) => getReminder(state, "dailyStudy"));

  return {
    today,
    week,
    title: getWeekTitle(week.at(0)?.date ?? today, week.at(-1)?.date ?? today),
    weekOffset,
    previousWeek: () => {
      selectionFeedback();
      setWeekOffset((offset) => offset - 1);
    },
    nextWeek: () => {
      selectionFeedback();
      setWeekOffset((offset) => offset + 1);
    },
    streak,
    totals,
    quizScore,
    upNext: next && nextDetail ? { ...next, ...nextDetail } : null,
    reminder,
    openUpNext: () => {
      if (next) router.push(planOverviewHref(next.plan.id));
    },
  };
}
