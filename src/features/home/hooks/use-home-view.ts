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
            }),
            currentDay: currentDay.dayNumber,
            totalDays: plan.lengthDays,
            completedDayCount: plan.progress.completedDays,
          },
          bar: {
            title: plan.title,
            day: formatDay(currentDay.dayNumber),
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
      router.push(studyHref(active.planId, active.currentDay));
    },
  };
}
