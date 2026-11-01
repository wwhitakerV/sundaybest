import { useEffect } from "react";
import { useRouter } from "expo-router";

import {
  NEW_PLAN_HREF,
  describePlanHero,
  formatDay,
  formatDayOfTotal,
  formatPlanLength,
  studyHref,
} from "@/entities/plan";
import { seriesLine } from "@/entities/sermon";
import { tabPlanHref } from "@/entities/tabs";
import { tapFeedback } from "@/core/haptics/haptics";
import { usePlansQuery } from "@/core/api/plan-queries";
import { useToday } from "@/core/store";
import { formatDotDate } from "@/utils/dates/formatDotDate";
import { getApiActivePlan, getApiSamplePlans, getApiUserPlans } from "@/features/plans";
import { homePlanOverviewHref } from "../logic/routes";
import { usePrefetch } from "@/core/api/prefetch";
import { prefetchImages } from "@/core/images/prefetch-images";
import { hasDevMenu, showDevActions } from "@/core/dev-menu/dev-menu";
import { useDailyVerse } from "./use-daily-verse";
import { useHomePreview } from "./use-home-preview";

/** The error a development build's "Couldn't load" preview shows. */
const PREVIEW_ERROR = new Error("Home's load error, previewed");

/** Home's server-backed plan view model. */
export function useHomeView() {
  const router = useRouter();
  const today = useToday();
  const plansQuery = usePlansQuery();
  const verse = useDailyVerse(today);
  // In a development build, Home can show any of its states, with made-up plans.
  const shown = useHomePreview(today, plansQuery.data?.plans ?? []);
  const allPlans = shown.kind === "plans" ? shown.plans : (plansQuery.data?.plans ?? []);
  const plan = getApiActivePlan(allPlans);
  const currentDay = plan?.currentDay ?? null;
  const prefetch = usePrefetch();
  // A previewed plan is made up: there's nothing on the server to warm.
  const activeId = shown.kind === "real" ? (plan?.id ?? null) : null;
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

  const words =
    plan && currentDay
      ? describePlanHero({
          status: "active",
          currentDay: currentDay.dayNumber,
          totalDays: plan.lengthDays,
          dayTitle: currentDay.title,
          minutes: currentDay.estimatedMinutes,
          waiting,
        })
      : null;
  const active =
    plan && currentDay && words
      ? {
          planId: plan.id,
          /** The study featured at the top of Home (`FeaturedStudy`). */
          study: {
            title: plan.title,
            series: seriesLine(plan.sermon),
            church: plan.sermon.church,
            thumbnailUrl: plan.sermon.thumbnailUrl,
            label: "IN PROGRESS",
            dayOfTotal: formatDayOfTotal(currentDay.dayNumber, plan.lengthDays).toUpperCase(),
            /** "Day 2", for the bar it collapses into. */
            day: formatDay(currentDay.dayNumber),
            today: words.today,
            action: words.action,
            waiting,
          },
          href: homePlanOverviewHref(plan.id),
          currentDay: currentDay.dayNumber,
        }
      : null;

  const hasPlans = getApiUserPlans(allPlans).length > 0;
  const loading = shown.kind === "loading" || (shown.kind === "real" && plansQuery.isPending);
  const error =
    shown.kind === "error"
      ? PREVIEW_ERROR
      : shown.kind === "real" && plansQuery.data === undefined
        ? plansQuery.error
        : null;

  return {
    date: formatDotDate(today),
    active,
    hasPlans,
    /** Ready-made plans of ours to try instead, for a newcomer. */
    samples: getApiSamplePlans(allPlans).map((sample) => ({
      id: sample.id,
      title: sample.title,
      thumbnailUrl: sample.sermon.thumbnailUrl,
      detail: [sample.sermon.church, formatPlanLength(sample.lengthDays)]
        .filter(Boolean)
        .join(" · "),
    })),
    /** Opens one of them, in Home: Back returns here. */
    openSample: (planId: string) => router.push(tabPlanHref("home", planId)),
    /** No plans of their own yet: Home is one thing to do — add a sermon. */
    onboarding: !loading && error === null && !hasPlans,
    /** Today's verse, under the plan; tapped, it's shared. */
    verse,
    loading,
    error,
    retry: () => void plansQuery.refetch(),
    /** Development builds only: a tap on the wordmark opens the development actions. */
    devActions: hasDevMenu() ? showDevActions : undefined,
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
