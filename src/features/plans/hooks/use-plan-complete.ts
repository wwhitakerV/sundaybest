import { useLocalSearchParams } from "expo-router";

import { NEW_PLAN_HREF, parsePlanParams, planOverviewHref } from "@/entities/plan";
import { usePlanQuery } from "@/core/api/plan-queries";
import { useModalSession } from "@/hooks/use-modal-session";
import { tapFeedback } from "@/core/haptics/haptics";
import { useReflectionAnswerCount } from "@/core/storage/reflection-answer-queries";

/** The completed plan's real server summary plus private device-only note count. */
export function usePlanComplete() {
  const session = useModalSession();

  const planId = parsePlanParams(useLocalSearchParams())?.planId ?? "";

  const planQuery = usePlanQuery(planId);

  const plan = planQuery.data?.plan ?? null;

  const reflectionIds =
    plan?.days.flatMap((day) => day.reflectionPrompts.map(({ id }) => id)) ?? [];

  const notesQuery = useReflectionAnswerCount(reflectionIds);

  const loading = planQuery.isPending || notesQuery.isPending;

  const close = () => session.exitTo(planOverviewHref(planId));

  if (!plan || notesQuery.data === undefined) {
    return {
      found: false,
      loading,

      error: planQuery.error ?? notesQuery.error,

      retry: async () => {
        await Promise.all([planQuery.refetch(), notesQuery.refetch()]);
      },

      close,
    } as const;
  }

  const quizDays = plan.days.filter((day) => day.quickCheck !== null);

  const quizCorrect = quizDays.reduce(
    (total, day) => total + (day.quickCheck?.correctCount ?? 0),
    0,
  );

  const quizTotal = quizDays.reduce(
    (total, day) => total + (day.quickCheck?.questionCount ?? 0),
    0,
  );

  return {
    found: true,
    loading: false,

    summary: {
      completedDays: plan.lengthDays,

      totalDays: plan.lengthDays,

      notes: notesQuery.data,

      quizCorrect,
      quizTotal,
    },

    close,

    addSermon: () => {
      tapFeedback();

      session.exitTo(NEW_PLAN_HREF);
    },
  } as const;
}
