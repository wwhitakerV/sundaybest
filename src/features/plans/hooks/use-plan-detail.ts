import { useEffect } from "react";
import { useRouter } from "expo-router";

import type { ApiPlanDetail } from "@/core/api/contracts";
import { usePlanQuery, useStartPlanMutation } from "@/core/api/plan-queries";
import {
  describePlanHero,
  describePlanStanding,
  getHeroPalette,
  quickCheckHref,
  studyHref,
} from "@/entities/plan";
import { selectionFeedback, tapFeedback } from "@/core/haptics/haptics";
import { useToday } from "@/core/store";
import { useTheme } from "@/theme";
import { describeDayCards } from "../logic/day-cards";
import { describeDayTile, type DayStepKey } from "../logic/day-rail";
import { describePlanAbout } from "../logic/plan-about";
import { STUDY_STEPS } from "../logic/study-steps";
import { usePlanMoreMenu } from "./use-plan-more-menu";
import { useSelectedDay } from "./use-selected-day";
import { useClearReadyBuild } from "./use-clear-ready-build";
import { usePrefetch } from "@/core/api/prefetch";

/**
 * One plan, as its pages show it — Plan Overview, and a page of the Plans
 * tab: its hero words, its days, the day picked, About this plan, its menu,
 * and every way into its study. Backed by the API's plan detail.
 */
export function usePlanDetail(planId: string) {
  const router = useRouter();
  const theme = useTheme();
  const planQuery = usePlanQuery(planId);
  useClearReadyBuild(planId);
  const startMutation = useStartPlanMutation();
  const plan = planQuery.data?.plan ?? null;
  const more = usePlanMoreMenu(planId);
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
  // Continue opens already loaded: today's study is fetched while the plan's read.
  const prefetch = usePrefetch();
  const openDay =
    currentDay && currentDay.status !== "locked" && plan?.status === "active"
      ? currentDay.dayNumber
      : null;
  useEffect(() => {
    if (planId && openDay !== null) prefetch.studyDay(planId, openDay);
  }, [planId, openDay, prefetch]);
  // Today's day done and the next not open yet: Continue says when it opens.
  const waiting = plan?.status === "active" && currentLockedDay(plan) !== null;
  const words =
    plan && currentDay
      ? describePlanHero({
          status: plan.status,
          currentDay: currentDay.dayNumber,
          totalDays: plan.lengthDays,
          dayTitle: currentDay.title,
          minutes: currentDay.estimatedMinutes,
          waiting,
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
    // A day not open yet is shown, locked, where it sits — never opened into
    // a screen that can only say so.
    const lockedDay = currentLockedDay(plan);
    if (lockedDay !== null) {
      if (lockedDay !== selectedNumber) selectionFeedback();
      pickDay(lockedDay);
      return;
    }
    tapFeedback();
    if (plan.status === "ready") {
      startMutation.mutate(plan.id, {
        onSuccess: ({ plan: startedPlan }) => openCurrentStudy(router, startedPlan),
      });
      return;
    }
    openCurrentStudy(router, plan);
  };

  if (!plan) {
    return {
      found: false,
      loading: planQuery.isPending,
      error: planQuery.error,
      retry: () => void planQuery.refetch(),
      continueLabel: null,
      continueWaiting: false,
      openCurrentDay,
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
    /** The plan featured at the top of its page on Plans (`PlanFeature`), as Home features one. */
    feature: words && {
      title: plan.title,
      church: plan.sermon.church,
      thumbnailUrl: plan.sermon.thumbnailUrl,
      ...describePlanStanding({
        status: plan.status,
        currentDay: currentDay?.dayNumber ?? plan.lengthDays,
        totalDays: plan.lengthDays,
      }),
      today: words.today,
      action: words.action,
      waiting,
    },
    continueLabel: words?.action ?? null,
    continueWaiting: waiting,
    about: describePlanAbout(plan.about),
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
    /** Its days as a plan page's cards show them. */
    dayCards: describeDayCards(days, currentDayNumber),
    /**
     * A day's card tapped: an open day goes straight into its study — the
     * plan's day where it was left — a plan not started is started first,
     * and a day not open yet stays where it is.
     */
    openDay: (dayNumber: number) => {
      const day = days.find((candidate) => candidate.dayNumber === dayNumber);
      if (!day || startMutation.isPending) return;
      if (day.progress.status === "locked") {
        selectionFeedback();
        return;
      }
      tapFeedback();
      if (plan.status === "ready") {
        startMutation.mutate(plan.id, {
          onSuccess: ({ plan: startedPlan }) => router.push(studyHref(startedPlan.id, dayNumber)),
        });
        return;
      }
      if (dayNumber === currentDayNumber && plan.status === "active") {
        openCurrentStudy(router, plan);
        return;
      }
      router.push(studyHref(plan.id, dayNumber));
    },
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
  } as const;
}

/** The day Continue would open, when it isn't open yet; otherwise null. */
function currentLockedDay(plan: ApiPlanDetail): number | null {
  const day = plan.days.find((candidate) => candidate.dayNumber === plan.progress.currentDayNumber);
  return day?.progress.status === "locked" && plan.status !== "ready" ? day.dayNumber : null;
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
