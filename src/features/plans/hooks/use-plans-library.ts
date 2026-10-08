import { useEffect, useState } from "react";
import { useRouter } from "expo-router";

import type { ApiPlanSummary } from "@/core/api/contracts";
import { usePlansQuery, useStartPlanMutation } from "@/core/api/plan-queries";
import { planOverviewHref, studyHref } from "@/entities/plan";
import { selectionFeedback, tapFeedback } from "@/core/haptics/haptics";
import {
  getApiCompletedPlans,
  getApiInProgressPlans,
  getApiPlansForFilter,
  getApiSavedPlans,
  getApiUserPlans,
} from "../logic/api-plan-collections";
import { describeApiLibraryPlan } from "../logic/api-plan-wording";
import { describeEmptyFilter, getPlanFilterOptions } from "../logic/plan-filters";
import { usePrefetch } from "@/core/api/prefetch";
import { prefetchImages } from "@/core/images/prefetch-images";

/** How many plans, from the top, are loaded before they're tapped. */
const PREFETCHED_PLANS = 6;

type LibraryCard = {
  plan: ApiPlanSummary;
  continueDay: number | null;
  startable: boolean;
};
type CardAction = { label: "Continue" | "Start"; onPress: () => void };

/** Plans tab backed directly by the API/TanStack cache. */
export function usePlansLibrary() {
  const router = useRouter();
  const [filter, setFilter] = useState("All");
  const plansQuery = usePlansQuery();
  const startMutation = useStartPlanMutation();
  const allPlans = plansQuery.data?.plans ?? [];
  const filtered = getApiPlansForFilter(allPlans, filter);

  const cards: LibraryCard[] = filtered.map((plan) => ({
    plan,
    continueDay:
      plan.status === "active"
        ? (plan.progress.currentDayNumber ?? plan.currentDay?.dayNumber ?? null)
        : null,
    startable: plan.status === "ready",
  }));

  // The plans on screen open already loaded, their artwork already drawn.
  const prefetch = usePrefetch();
  const shownIds = cards
    .slice(0, PREFETCHED_PLANS)
    .map((card) => card.plan.id)
    .join(",");
  const artwork = filtered.map((plan) => plan.sermon.thumbnailUrl).join("\n");
  useEffect(() => {
    for (const planId of shownIds.split(",").filter(Boolean)) prefetch.plan(planId);
  }, [shownIds, prefetch]);
  useEffect(() => {
    prefetchImages(artwork.split("\n"));
  }, [artwork]);

  const displayCards = cards.map((card) => ({
    ...card,
    thumbnailUrl: card.plan.sermon.thumbnailUrl,
    church: card.plan.sermon.church,
    look: describeApiLibraryPlan(card.plan),
    percent: card.plan.progress.percentage,
    done: card.plan.status === "completed",
  }));

  const filters = getPlanFilterOptions({
    all: getApiUserPlans(allPlans).length,
    inProgress: getApiInProgressPlans(allPlans).length,
    done: getApiCompletedPlans(allPlans).length,
    saved: getApiSavedPlans(allPlans).length,
  });

  function openPlan(planId: string) {
    router.push(planOverviewHref(planId));
  }

  function continuePlan(plan: LibraryCard["plan"], dayNumber: number) {
    tapFeedback();
    // A day not open yet is shown, locked, on the plan — never opened into a
    // screen that can only say so.
    router.push(
      plan.currentDay?.status === "locked"
        ? planOverviewHref(plan.id)
        : studyHref(plan.id, dayNumber),
    );
  }

  function beginPlan(planId: string) {
    tapFeedback();
    startMutation.mutate(planId, {
      onSuccess: ({ plan }) => {
        const dayNumber = plan.progress.currentDayNumber ?? plan.days.at(0)?.dayNumber ?? 1;
        router.push(studyHref(plan.id, dayNumber));
      },
    });
  }

  return {
    filter,
    setFilter: (next: string) => {
      if (next !== filter) selectionFeedback();
      setFilter(next);
    },
    filters,
    cards: displayCards,
    empty: describeEmptyFilter(filter),
    loading: plansQuery.isPending,
    error: plansQuery.data === undefined ? plansQuery.error : null,
    retry: () => void plansQuery.refetch(),
    openPlan,
    continuePlan,
    startPlan: beginPlan,
    actionFor: ({ plan, continueDay, startable }: LibraryCard): { action?: CardAction } => {
      if (continueDay !== null) {
        return {
          action: { label: "Continue", onPress: () => continuePlan(plan, continueDay) },
        };
      }
      return startable ? { action: { label: "Start", onPress: () => beginPlan(plan.id) } } : {};
    },
  };
}
