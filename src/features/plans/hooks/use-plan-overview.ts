import { Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import {
  describePlanHero,
  getHeroPalette,
  parsePlanParams,
} from "@/entities/plan";
import { usePlanQuery, useStartPlanMutation } from "@/core/api/queries";
import { selectionFeedback, tapFeedback } from "@/core/haptics/haptics";
import { useToday } from "@/core/store";
import { useTheme } from "@/theme";
import { describeDayTile, type DayStepKey } from "../logic/day-rail";
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
    if (!plan) return;
    tapFeedback();
    if (plan.status === "ready") {
      startMutation.mutate(plan.id);
      return;
    }
    explainStudyBoundary();
  };

  const goBack = () => router.back();

  if (!plan) {
    return {
      found: false,
      loading: planQuery.isPending,
      continueLabel: null,
      openCurrentDay,
      goBack,
    } as const;
  }

  const colors = plan.sermon.thumbnailColors;

  return {
    found: true,
    loading: false,
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
    openStep: (_key: DayStepKey) => explainStudyBoundary(),
    goBack,
  } as const;
}

function explainStudyBoundary() {
  Alert.alert(
    "Daily Study is next",
    "This plan is live on the API. The Daily Study flow is the next data slice being moved off the legacy mock store.",
  );
}
