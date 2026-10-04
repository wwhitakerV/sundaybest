import { useRouter } from "expo-router";

import { planCompleteHref, planOverviewHref } from "@/entities/plan";
import { useProgressQuery, useRemindersQuery } from "@/core/api/queries";
import { useModalSession } from "@/hooks/use-modal-session";
import { useToday } from "@/core/store";
import { getWeekStartSunday } from "@/features/progress/logic/week";
import { describeStreak, describeUpNextTime } from "../logic/day-complete";
import { useStudyRoute } from "./use-study-route";

/** Day Complete backed by server progress, reminders, and the real plan. */
export function useDayComplete() {
  const router = useRouter();
  const session = useModalSession();
  const today = useToday();
  const route = useStudyRoute();

  const { planId, dayNumber, plan, day } = route;

  const progressQuery = useProgressQuery(getWeekStartSunday(today));

  const remindersQuery = useRemindersQuery();

  const progress = progressQuery.data ?? null;

  const reminder =
    remindersQuery.data?.reminders.find((candidate) => candidate.kind === "dailyStudy") ?? null;

  const next = plan?.days.find((candidate) => candidate.dayNumber === dayNumber + 1) ?? null;

  const isPlanComplete = plan?.status === "completed";

  const loading = route.loading || progressQuery.isPending || remindersQuery.isPending;

  if (!plan || !day || !progress) {
    return {
      found: false,
      loading,
      dayNumber,

      error: route.error ?? progressQuery.error,

      retry: async () => {
        await Promise.all([route.refetch(), progressQuery.refetch(), remindersQuery.refetch()]);
      },
    } as const;
  }

  return {
    found: true,
    loading: false,

    dayNumber,
    today: progress.today,

    streakLabel: describeStreak(progress.streak.current),

    week: progress.week,

    upNext: next
      ? {
          title: next.reading.title,
          when: describeUpNextTime(reminder),
        }
      : null,

    done: () => {
      if (isPlanComplete) {
        router.replace(planCompleteHref(planId));
        return;
      }

      session.exitTo(planOverviewHref(planId));
    },
  } as const;
}
