import { useLocalSearchParams, useRouter } from "expo-router";

import type { ApiPlanDetail } from "@/core/api/contracts";
import { usePlanQuery, useStartPlanMutation } from "@/core/api/queries";
import {
  PLANS_HREF,
  describePlanHero,
  getHeroPalette,
  parsePlanParams,
  quickCheckHref,
  studyHref,
} from "@/entities/plan";
import { selectionFeedback, tapFeedback } from "@/core/haptics/haptics";
import { useToday } from "@/core/store";
import { useTheme } from "@/theme";
import { describeDayTile, type DayStepKey } from "../logic/day-rail";
import { STUDY_STEPS } from "../logic/study-steps";
import { usePlanMoreMenu } from "./use-plan-more-menu";
import { useSelectedDay } from "./use-selected-day";

/** Plan Detail backed by the real API plan/detail contract. */
export function usePlanOverview() {
  const router = useRouter();
  const theme = useTheme();
  const planId = parsePlanParams(useLocalSearchParams())?.planId ?? "";
  const planQuery = usePlanQuery(planId);
  const startMutation = useStartPlanMutation();
  const plan = planQuery.data?.plan ?? null;
  const more = usePlanMoreMenu(planId, plan?.saved ?? false);
  const today = useToday();
  const days = plan?.days ?? [];
  const currentDayNumber = plan?.progress.currentDayNumber ?? null;
  const { selectedNumber, pickDay, selected } = useSelectedDay({
    days,
    currentDayNumber,
    quickCheckEnabled: plan?.quickCheckEnabled ?? false,
    today,
  });

  const currentDay = plan?.currentDay ?? null;
  const words =
    plan && currentDay
      ? describePlanHero({
          status: plan.status,
          currentDay: currentDay.dayNumber,
          totalDays: plan.lengthDays,
          dayTitle: currentDay.title,
          minutes: currentDay.estimatedMinutes,
        })
      : plan?.status === "completed" && plan.days.at(-1)
        ? describePlanHero({
            status: "completed",
            currentDay: plan.lengthDays,
            totalDays: plan.lengthDays,
            dayTitle: plan.days.at(-1)?.reading.title ?? plan.title,
            minutes: plan.days.at(-1)?.estimatedMinutes ?? 1,
          })
        : null;

  const openCurrentDay = () => {
    if (!plan || startMutation.isPending) return;
    tapFeedback();
    if (plan.status === "ready") {
      startMutation.mutate(plan.id, {
        onSuccess: ({ plan: startedPlan }) => openCurrentStudy(router, startedPlan),
      });
      return;
    }
    openCurrentStudy(router, plan);
  };

  // Plan Detail's back affordance is intentionally deterministic. It is not a
  // history back button: it always returns to the main Plans tab.
  const goBack = () => router.replace(PLANS_HREF);

  if (!plan) {
    return {
      found: false,
      loading: planQuery.isPending,
      error: planQuery.error,
      retry: () => void planQuery.refetch(),
      continueLabel: null,
      openCurrentDay,
      goBack,
    } as const;
  }

  const colors = plan.sermon.thumbnailColors;

  return {
    found: true,
    loading: false,
    error: null,
    retry: () => void planQuery.refetch(),
    planId,
    totalDays: plan.lengthDays,
    hero: words && {
      title: plan.title,
      church: plan.sermon.church,
      thumbnailUrl: plan.sermon.thumbnailUrl,
      colors,
      words,
      totalDays: plan.lengthDays,
      completedDayCount: plan.progress.completedDays,
    },
    continueLabel: words?.action ?? null,
    light: getHeroPalette(colors, theme.colors.featureBackdrop).light,
    tiles: days.map((day) =>
      describeDayTile(
        {
          dayNumber: day.dayNumber,
          status: day.progress.status,
          scheduledOn: day.progress.scheduledOn,
        },
        currentDayNumber,
        { locked: day.progress.status === "locked" },
      ),
    ),
    selectedNumber,
    selected,
    pickDay: (dayNumber: number) => {
      if (dayNumber !== selectedNumber) selectionFeedback();
      pickDay(dayNumber);
    },
    openCurrentDay,
    more,
    openStep: (key: DayStepKey) => {
      if (!selected || startMutation.isPending) return;
      tapFeedback();

      const open = (startedPlan: ApiPlanDetail) => {
        if (key === "quickCheck") {
          router.push(quickCheckHref(startedPlan.id, selected.day.dayNumber));
          return;
        }
        router.push(studyHref(startedPlan.id, selected.day.dayNumber, key));
      };

      // A ready/sample plan becomes the user's enrollment before any study
      // route opens. Without this, tapping Read directly (rather than the hero
      // Start button) would ask the study API for a day the user has not yet
      // started and correctly receive an access error.
      if (plan.status === "ready") {
        startMutation.mutate(plan.id, {
          onSuccess: ({ plan: startedPlan }) => open(startedPlan),
        });
        return;
      }

      open(plan);
    },
    goBack,
  } as const;
}

function openCurrentStudy(router: ReturnType<typeof useRouter>, plan: ApiPlanDetail): void {
  const day =
    plan.days.find((candidate) => candidate.dayNumber === plan.progress.currentDayNumber) ??
    plan.days.find((candidate) => candidate.progress.status !== "completed") ??
    plan.days.at(-1);
  if (!day) return;

  const studyDone = STUDY_STEPS.every(({ key }) => day.progress.completedSteps.includes(key));
  if (studyDone && day.quickCheck && day.progress.status !== "completed") {
    router.push(quickCheckHref(plan.id, day.dayNumber));
    return;
  }

  const nextStep =
    STUDY_STEPS.find(({ key }) => !day.progress.completedSteps.includes(key))?.key ?? "read";
  router.push(studyHref(plan.id, day.dayNumber, nextStep));
}
