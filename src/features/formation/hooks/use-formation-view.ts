import { useLocalSearchParams, useRouter } from "expo-router";

import { usePlansQuery } from "@/core/api/plan-queries";
import { getApiActivePlan, getApiSamplePlan } from "@/features/plans";
import { FORMATION_LAYOUTS } from "../logic/formation-layouts";
import { parseFormationVersion } from "../logic/formation-params";

/**
 * Formation's view model: the version asked for (`?v=`) — its layout, and
 * its place among them (its paper's) — and the plan its lead shows (and
 * vIdeal's header names): the plan under way, as Home features it, or, with
 * none, one of ours to try — and its way back.
 */
export function useFormationView() {
  const router = useRouter();
  const id = parseFormationVersion(useLocalSearchParams());
  const index = Math.max(
    0,
    FORMATION_LAYOUTS.findIndex((layout) => layout.id === id),
  );
  const plansQuery = usePlansQuery();
  const plans = plansQuery.data?.plans ?? [];
  const plan = getApiActivePlan(plans) ?? getApiSamplePlan(plans);

  return {
    layout: FORMATION_LAYOUTS[index] ?? FORMATION_LAYOUTS[0]!,
    index,
    /** The plan the lead shows: none until the plans are in, or with none to show. */
    planId: plan?.id ?? null,
    /** Its title, for vIdeal's header: none until the plans are in. */
    title: plan?.title ?? null,
    /** Back to the page it was opened from. */
    back: () => router.back(),
  };
}
