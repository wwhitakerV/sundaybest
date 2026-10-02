import { useRouter } from "expo-router";

import {
  NEW_PLAN_HREF,
  describePlanHero,
  formatDay,
  planOverviewHref,
  studyHref,
} from "@/entities/plan";
import { tapFeedback } from "@/core/haptics/haptics";
import {
  getActivePlan,
  getCurrentPlanDay,
  getDayMinutes,
  getPlanProgress,
  getSamplePlan,
  getSermonForPlan,
  getUserPlans,
  useAppSelector,
  useToday,
} from "@/core/store";
import { formatDotDate } from "@/utils/dates/formatDotDate";
import { describePlan } from "../logic/describe-plan";
import { homePlanOverviewHref } from "../logic/routes";

/**
 * Home's view model: today's date, the plan under way (its hero and its
 * collapsed bar) if there is one, whether the user has plans — or else the
 * sample to try — and where each thing on Home leads.
 */
export function useHomeView() {
  const router = useRouter();
  const today = useToday();
  const plan = useAppSelector(getActivePlan);
  const progress = useAppSelector((state) => (plan ? getPlanProgress(state, plan.id) : null));
  const sermon = useAppSelector((state) => (plan ? getSermonForPlan(state, plan.id) : null));
  const todayStudy = useAppSelector((state) => {
    const day = plan ? getCurrentPlanDay(state, plan.id) : null;
    return day ? { day, minutes: getDayMinutes(state, day.id) } : null;
  });
  const hasPlans = useAppSelector((state) => getUserPlans(state).length > 0);
  const sample = useAppSelector(getSamplePlan);
  const sampleDetail = useAppSelector((state) =>
    sample ? describePlan(sample, getPlanProgress(state, sample.id)) : "",
  );

  const active =
    plan && progress && todayStudy
      ? {
          planId: plan.id,
          hero: {
            title: plan.title,
            church: sermon?.church ?? null,
            thumbnailUrl: sermon?.thumbnailUrl ?? null,
            colors: sermon?.thumbnailColors ?? [],
            words: describePlanHero({
              status: "active",
              currentDay: progress.currentDayNumber,
              totalDays: progress.totalDays,
              dayTitle: todayStudy.day.reading.title,
              minutes: todayStudy.minutes,
            }),
            currentDay: progress.currentDayNumber,
            totalDays: progress.totalDays,
            completedDayCount: progress.completedDayCount,
          },
          bar: {
            title: plan.title,
            day: formatDay(progress.currentDayNumber),
            thumbnailUrl: sermon?.thumbnailUrl ?? null,
            colors: sermon?.thumbnailColors ?? [],
          },
          href: homePlanOverviewHref(plan.id),
          currentDay: progress.currentDayNumber,
        }
      : null;

  return {
    date: formatDotDate(today),
    active,
    hasPlans,
    sample: sample ? { id: sample.id, title: sample.title, detail: sampleDetail } : null,
    /** The artwork that flies into the bar — there whenever a plan's under way. */
    flight: plan ? { thumbnailUrl: sermon?.thumbnailUrl ?? null } : null,
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
