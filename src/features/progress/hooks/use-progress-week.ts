import { useState } from "react";
import { useRouter } from "expo-router";

import { useProgressQuery, useRemindersQuery } from "@/core/api/queries";
import { studyHref } from "@/entities/plan";
import { selectionFeedback } from "@/core/haptics/haptics";
import { useToday } from "@/core/store";
import { addDays } from "@/utils/dates/addDays";
import { getWeekStartSunday, getWeekTitle } from "../logic/week";

/** Progress view model backed by /v1/me/progress. */
export function useProgressWeek() {
  const router = useRouter();
  const today = useToday();
  const [weekOffset, setWeekOffset] = useState(0);
  const weekStart = addDays(getWeekStartSunday(today), weekOffset * 7);
  const progressQuery = useProgressQuery(weekStart);
  const remindersQuery = useRemindersQuery();
  const progress = progressQuery.data;
  const week = progress?.week ?? Array.from({ length: 7 }, (_, index) => ({
    date: addDays(weekStart, index),
    completedDayCount: 0,
  }));
  const reminder = remindersQuery.data?.reminders.find((item) => item.kind === "dailyStudy") ?? null;
  const upNext = progress?.upNext ?? null;

  return {
    today: progress?.today ?? today,
    week,
    title: getWeekTitle(week[0]?.date ?? weekStart, week.at(-1)?.date ?? addDays(weekStart, 6)),
    weekOffset,
    previousWeek: () => {
      selectionFeedback();
      setWeekOffset((offset) => offset - 1);
    },
    nextWeek: () => {
      selectionFeedback();
      setWeekOffset((offset) => offset + 1);
    },
    streak: progress?.streak ?? { current: 0, longest: 0 },
    totals: progress?.totals ?? { completedDayCount: 0, completedPlanCount: 0 },
    quizScore: progress?.latestQuickCheck ?? null,
    upNext: upNext
      ? {
          plan: upNext.plan,
          day: upNext.day,
          date: upNext.date,
          minutes: upNext.day.estimatedMinutes,
          percent: upNext.plan.progress.percentage,
        }
      : null,
    reminder,
    loading: progressQuery.isPending,
    error: progressQuery.data === undefined ? progressQuery.error : null,
    retry: () => void progressQuery.refetch(),
    openUpNext: () => {
      if (upNext) router.push(studyHref(upNext.plan.id, upNext.day.dayNumber));
    },
  };
}
