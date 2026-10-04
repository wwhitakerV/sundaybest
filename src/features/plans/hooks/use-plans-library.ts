import { useState } from "react";
import { useRouter } from "expo-router";

import type { ApiPlanSummary } from "@/core/api/contracts";
import { usePlansQuery, useStartPlanMutation } from "@/core/api/queries";
import { planOverviewHref } from "@/entities/plan";
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
      plan.status === "active" ? (plan.progress.currentDayNumber ?? plan.currentDay?.dayNumber ?? null) : null,
    startable: plan.status === "ready",
  }));

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

  function continuePlan(planId: string) {
    tapFeedback();
    // Study itself is the next migration slice. Keep server UUIDs out of the
    // legacy study store and enter through the real plan overview for now.
    openPlan(planId);
  }

  function beginPlan(planId: string) {
    tapFeedback();
    startMutation.mutate(planId, {
      onSuccess: () => openPlan(planId),
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
    openPlan,
    continuePlan,
    startPlan: beginPlan,
    actionFor: ({ plan, continueDay, startable }: LibraryCard): { action?: CardAction } => {
      if (continueDay !== null) {
        return { action: { label: "Continue", onPress: () => continuePlan(plan.id) } };
      }
      return startable ? { action: { label: "Start", onPress: () => beginPlan(plan.id) } } : {};
    },
  };
}
