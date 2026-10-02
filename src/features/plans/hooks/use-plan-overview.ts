import { useLocalSearchParams, useRouter } from "expo-router";

import {
  describePlanHero,
  getHeroPalette,
  parsePlanParams,
  quickCheckHref,
  studyHref,
} from "@/entities/plan";
import { selectionFeedback, tapFeedback } from "@/core/haptics/haptics";
import {
  getCurrentPlanDay,
  getDayMinutes,
  getPlanById,
  getPlanDays,
  getPlanProgress,
  getSermonForPlan,
  useAppSelector,
} from "@/core/store";
import { useTheme } from "@/theme";
import { describeDayTile, type DayStepKey } from "../logic/day-rail";
import { usePlanMoreMenu } from "./use-plan-more-menu";
import { useSelectedDay } from "./use-selected-day";

/**
 * Plan Detail's view model, from its route and the store: the plan's hero,
 * its days as tiles, the day picked and what it holds, its More menu
 * (`usePlanMoreMenu`), and where each thing leads. `found: false` when the route doesn't name a plan that exists.
 * Everything's read on every render, so coming back shows what's changed.
 */
export function usePlanOverview() {
  const router = useRouter();
  const theme = useTheme();
  const planId = parsePlanParams(useLocalSearchParams())?.planId ?? "";
  const plan = useAppSelector((state) => getPlanById(state, planId));
  const sermon = useAppSelector((state) => getSermonForPlan(state, planId));
  const progress = useAppSelector((state) => getPlanProgress(state, planId));
  const currentDay = useAppSelector((state) => getCurrentPlanDay(state, planId));
  const days = useAppSelector((state) =>
    getPlanDays(state, planId).map((day) => ({ day, minutes: getDayMinutes(state, day.id) })),
  );
  const more = usePlanMoreMenu(planId);
  const { selectedNumber, pickDay, selected } = useSelectedDay({
    days,
    currentDayNumber: currentDay?.dayNumber ?? null,
    quickCheckEnabled: plan?.quickCheckEnabled ?? false,
  });

  const currentMinutes = days.find(({ day }) => day.id === currentDay?.id)?.minutes ?? 0;
  const words =
    plan && progress && currentDay
      ? describePlanHero({
          status: plan.status,
          currentDay: currentDay.dayNumber,
          totalDays: progress.totalDays,
          dayTitle: currentDay.reading.title,
          minutes: currentMinutes,
        })
      : null;
  const openDay = (dayNumber: number) => router.push(studyHref(planId, dayNumber));
  const openCurrentDay = () => {
    if (!currentDay) return;
    tapFeedback();
    openDay(currentDay.dayNumber);
  };
  const goBack = () => router.back();

  if (!plan || !progress) {
    return { found: false, continueLabel: null, openCurrentDay, goBack } as const;
  }
  const colors = sermon?.thumbnailColors ?? [];

  return {
    found: true,
    planId,
    totalDays: progress.totalDays,
    hero: words && {
      title: plan.title,
      church: sermon?.church ?? null,
      thumbnailUrl: sermon?.thumbnailUrl ?? null,
      colors,
      words,
      totalDays: progress.totalDays,
      completedDayCount: progress.completedDayCount,
    },
    continueLabel: words?.action ?? null,
    light: getHeroPalette(colors, theme.colors.featureBackdrop).light,
    tiles: days.map(({ day }) => describeDayTile(day, currentDay?.dayNumber ?? null)),
    selectedNumber,
    selected,
    pickDay: (dayNumber: number) => {
      if (dayNumber !== selectedNumber) selectionFeedback();
      pickDay(dayNumber);
    },
    openCurrentDay,
    more,
    openStep: (key: DayStepKey) => {
      if (!selected) return;
      if (key === "quickCheck") router.push(quickCheckHref(planId, selected.day.dayNumber));
      else openDay(selected.day.dayNumber);
    },
    goBack,
  } as const;
}
