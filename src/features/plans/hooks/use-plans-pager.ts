import { useEffect, useState } from "react";
import { useRouter } from "expo-router";

import { usePlansQuery } from "@/core/api/plan-queries";
import { usePrefetch } from "@/core/api/prefetch";
import { selectionFeedback } from "@/core/haptics/haptics";
import { prefetchImages } from "@/core/images/prefetch-images";
import { PLAN_DRAWERS, type PlanDrawerKey } from "../components/PlanDrawers";
import { orderPlanPages } from "../logic/plan-pages";
import { describeEmptyLibrary } from "../logic/plan-filters";
import { PLANS_SEARCH_AT } from "../logic/plan-search";

/** Fetched ahead of the plan in view: the one before it, and the two after. */
const AHEAD = { before: 1, after: 2 };

/**
 * The Plans tab as pages, one plan to each: their order (`orderPlanPages`);
 * the plan in view's neighbours fetched ahead, their artwork too, so turning
 * to them waits on nothing; the drawers open, kept the same on every page;
 * and, from two plans, the search.
 */
export function usePlansPager() {
  const router = useRouter();
  const plansQuery = usePlansQuery();
  const plans = plansQuery.data?.plans ?? [];
  const pages = orderPlanPages(plans);
  const [shown, setInView] = useState(0);
  const inView = Math.max(0, Math.min(pages.length - 1, shown));
  // Every drawer open to begin with: the whole plan, there to read.
  const [openDrawers, setOpenDrawers] = useState<ReadonlySet<PlanDrawerKey>>(
    () => new Set(PLAN_DRAWERS),
  );

  const prefetch = usePrefetch();
  const near = pages
    .slice(Math.max(0, inView - AHEAD.before), inView + AHEAD.after + 1)
    .map((plan) => plan.id)
    .join(",");
  useEffect(() => {
    for (const planId of near.split(",").filter(Boolean)) prefetch.plan(planId);
  }, [near, prefetch]);
  const artwork = pages.map((plan) => plan.sermon.thumbnailUrl).join("\n");
  useEffect(() => {
    prefetchImages(artwork.split("\n"));
  }, [artwork]);

  return {
    /** Each page's plan, in order. */
    planIds: pages.map((plan) => plan.id),
    loading: plansQuery.isPending,
    error: plansQuery.data === undefined ? plansQuery.error : null,
    retry: () => void plansQuery.refetch(),
    empty: describeEmptyLibrary(null),
    searchable: pages.length >= PLANS_SEARCH_AT,
    openSearch: () => router.push("/plan-search"),
    /** The page in view: the one past halfway as the pages move. */
    inView,
    /** Page `index` came into view — React's own setter, so the UI thread can hold it. */
    setInView,
    openDrawers,
    /** A drawer opened or closed — on every page, as the plans turn. */
    toggleDrawer: (key: PlanDrawerKey) => {
      selectionFeedback();
      setOpenDrawers((current) => {
        const next = new Set(current);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        return next;
      });
    },
  };
}
