import { useState } from "react";
import { useRouter } from "expo-router";

import { planOverviewHref, studyHref } from "@/entities/plan";
import { selectionFeedback, tapFeedback } from "@/core/haptics/haptics";
import {
  getCompletedPlans,
  getCurrentPlanDay,
  getInProgressPlans,
  getLibraryPlans,
  getPlanProgress,
  getSermonForPlan,
  getUserPlans,
  useAppSelector,
  useStoreActions,
} from "@/core/store";
import type { Plan } from "@/types/domain";
import { describeLibraryPlan } from "../logic/library";
import {
  describeEmptyFilter,
  getPlanFilterOptions,
  getPlansForFilter,
} from "../logic/plan-filters";

type LibraryCard = { plan: Plan; continueDay: number | null; startable: boolean };
type CardAction = { label: "Continue" | "Start"; onPress: () => void };

/**
 * The library's view model: the filter picked (All, In progress, Done,
 * Saved), each filter's count, and the plans it shows — each with its
 * sermon's thumbnail and where it stands — all read from the store. A plan
 * under way also carries the day Continue opens, straight into its study; one
 * not started, Start, which begins it at day 1.
 */
export function usePlansLibrary() {
  const router = useRouter();
  const [filter, setFilter] = useState("All");
  const { startPlan } = useStoreActions();
  const cards = useAppSelector((state) =>
    getPlansForFilter(state, filter).map((plan) => {
      const progress = getPlanProgress(state, plan.id);
      const sermon = getSermonForPlan(state, plan.id);
      return {
        plan,
        thumbnailUrl: sermon?.thumbnailUrl ?? null,
        church: sermon?.church ?? null,
        look: describeLibraryPlan(plan, { currentDayNumber: progress?.currentDayNumber ?? 1 }),
        percent: progress?.completionPercentage ?? 0,
        done: plan.status === "completed",
        /** Not started yet — Start begins it. */
        startable: plan.status === "ready",
        /** The day Continue opens — only for a plan under way. */
        continueDay:
          plan.status === "active" ? (getCurrentPlanDay(state, plan.id)?.dayNumber ?? null) : null,
      };
    }),
  );
  const filters = useAppSelector((state) =>
    getPlanFilterOptions({
      all: getUserPlans(state).length,
      inProgress: getInProgressPlans(state).length,
      done: getCompletedPlans(state).length,
      saved: getLibraryPlans(state).length,
    }),
  );

  function continuePlan(planId: string, dayNumber: number) {
    tapFeedback();
    router.push(studyHref(planId, dayNumber));
  }

  function beginPlan(planId: string) {
    tapFeedback();
    startPlan(planId);
    router.push(studyHref(planId, 1));
  }

  return {
    filter,
    setFilter: (next: string) => {
      if (next !== filter) selectionFeedback();
      setFilter(next);
    },
    filters,
    cards,
    /** What to say when the filter picked holds no plans. */
    empty: describeEmptyFilter(filter),
    openPlan: (planId: string) => router.push(planOverviewHref(planId)),
    continuePlan,
    /** Begins a plan not started, and opens its first day. */
    startPlan: beginPlan,
    /** A card's action: Continue for a plan under way, Start for one not started, none once done. */
    actionFor: ({ plan, continueDay, startable }: LibraryCard): { action?: CardAction } => {
      if (continueDay !== null) {
        return { action: { label: "Continue", onPress: () => continuePlan(plan.id, continueDay) } };
      }
      return startable ? { action: { label: "Start", onPress: () => beginPlan(plan.id) } } : {};
    },
  };
}
