import { useEffect } from "react";
import { useRouter } from "expo-router";

import {
  NEW_PLAN_HREF,
  describePlanHero,
  formatDay,
  planOverviewHref,
  studyHref,
} from "@/entities/plan";
import { tapFeedback } from "@/core/haptics/haptics";
import { usePlansQuery } from "@/core/api/queries";
import { useToday } from "@/core/store";
import { formatDotDate } from "@/utils/dates/formatDotDate";
import {
  getApiActivePlan,
  getApiSamplePlan,
  getApiUserPlans,
} from "@/features/plans/logic/api-plan-collections";
import { describeApiPlan } from "@/features/plans/logic/api-plan-wording";
import { homePlanOverviewHref } from "../logic/routes";
import { usePrefetch } from "@/core/api/prefetch";
import { prefetchImages } from "@/core/images/prefetch-images";

/** Home's server-backed plan view model. */
export function useHomeView() {
  const router = useRouter();
  const today = useToday();
  const plansQuery = usePlansQuery();
  const allPlans = plansQuery.data?.plans ?? [];
  const plans = getApiUserPlans(allPlans);
  const plan = getApiActivePlan(allPlans);
  const sample = getApiSamplePlan(allPlans);
  const currentDay = plan?.currentDay ?? null;
  const prefetch = usePrefetch();
  const activeId = plan?.id ?? null;
  const openDay = currentDay && currentDay.status !== "locked" ? currentDay.dayNumber : null;
  // Today's day done and the next not open yet: Continue says when it opens.
  const waiting = currentDay?.status === "locked";

  // Every plan's artwork on Home is drawn the moment it's shown.
  const artwork = allPlans.map((candidate) => candidate.sermon.thumbnailUrl).join("\n");
  useEffect(() => {
    prefetchImages(artwork.split("\n"));
  }, [artwork]);

  // Home's two ways on — the plan, and today's study — arrive already loaded.
  useEffect(() => {
    if (!activeId) return;
    prefetch.plan(activeId);
    if (openDay !== null) prefetch.studyDay(activeId, openDay);
  }, [activeId, openDay, prefetch]);

  const active =
    plan && currentDay
      ? {
          planId: plan.id,
          hero: {
            title: plan.title,
            church: plan.sermon.church,
            thumbnailUrl: plan.sermon.thumbnailUrl,
            colors: plan.sermon.thumbnailColors,
            words: describePlanHero({
              status: "active",
              currentDay: currentDay.dayNumber,
              totalDays: plan.lengthDays,
              dayTitle: currentDay.title,
              minutes: currentDay.estimatedMinutes,
              waiting,
            }),
            currentDay: currentDay.dayNumber,
            totalDays: plan.lengthDays,
            completedDayCount: plan.progress.completedDays,
          },
          bar: {
            title: plan.title,
            day: formatDay(currentDay.dayNumber),
            waiting,
            thumbnailUrl: plan.sermon.thumbnailUrl,
            colors: plan.sermon.thumbnailColors,
          },
          href: homePlanOverviewHref(plan.id),
          currentDay: currentDay.dayNumber,
        }
      : null;

  return {
    date: formatDotDate(today),
    active,
    plans,
    hasPlans: plans.length > 0,
    sample: sample ? { id: sample.id, title: sample.title, detail: describeApiPlan(sample) } : null,
    flight: plan ? { thumbnailUrl: plan.sermon.thumbnailUrl } : null,
    loading: plansQuery.isPending,
    error: plansQuery.data === undefined ? plansQuery.error : null,
    retry: () => void plansQuery.refetch(),
    openPlan: (planId: string) => router.push(planOverviewHref(planId)),
    openSample: () => {
      if (sample) router.push(planOverviewHref(sample.id));
    },
    addSermon: () => {
      tapFeedback();
      router.push(NEW_PLAN_HREF);
    },
    continueToday: () => {
      if (!active) return;
      tapFeedback();
      // A day not open yet is shown, locked, on the plan instead.
      router.push(
        currentDay?.status === "locked" ? active.href : studyHref(active.planId, active.currentDay),
      );
    },
  };
}
