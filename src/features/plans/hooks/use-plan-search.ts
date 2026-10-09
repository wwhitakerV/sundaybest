import { useEffect, useState } from "react";
import { useRouter } from "expo-router";

import { usePlanSearchQuery } from "@/core/api/plan-queries";
import { usePrefetch } from "@/core/api/prefetch";
import { prefetchImages } from "@/core/images/prefetch-images";
import { planOverviewHref } from "@/entities/plan";
import {
  PLAN_SEARCH_DEBOUNCE_MS,
  describeNoMatch,
  describeResultDetail,
  keepStillMatching,
  normalizePlanSearch,
  splitMatches,
  type PlanSearchStatus,
} from "../logic/plan-search";
import { useDebouncedValue } from "./use-debounced-value";

/** How many results, from the top, are loaded before they're tapped. */
const PREFETCHED_PLANS = 3;

/**
 * Plans' search: the words typed, searched once they hold still; the rows
 * found, best first, the words in each title marked. While the next search
 * waits or is out, the last rows that still match stay where they are — only
 * those that no longer match leave — and the new answer reorders them in
 * place. A tap anywhere on a row opens its plan.
 */
export function usePlanSearch() {
  const router = useRouter();
  const prefetch = usePrefetch();
  const [words, setWords] = useState("");
  const typed = normalizePlanSearch(words);
  const settled = useDebouncedValue(typed, PLAN_SEARCH_DEBOUNCE_MS);
  const query = usePlanSearchQuery(settled);

  // The answer for exactly these words — or, until it comes, the last one, narrowed to them.
  const answered = query.isSuccess && !query.isPlaceholderData && settled === typed;
  const last = typed.length > 0 ? (query.data?.results ?? []) : [];
  const results = answered ? last : keepStillMatching(last, typed);
  const status: PlanSearchStatus =
    typed.length === 0
      ? "idle"
      : answered
        ? results.length > 0
          ? "ready"
          : "empty"
        : query.isError && settled === typed && !query.isFetching
          ? "error"
          : "searching";

  // The plans found open already loaded, their artwork already drawn.
  const shownIds = results
    .slice(0, PREFETCHED_PLANS)
    .map(({ plan }) => plan.id)
    .join(",");
  const artwork = results.map(({ plan }) => plan.sermon.thumbnailUrl).join("\n");
  useEffect(() => {
    for (const planId of shownIds.split(",").filter(Boolean)) prefetch.plan(planId);
  }, [shownIds, prefetch]);
  useEffect(() => {
    prefetchImages(artwork.split("\n"));
  }, [artwork]);

  return {
    words,
    setWords,
    status,
    rows: results.map(({ plan, matched }) => ({
      id: plan.id,
      title: plan.title,
      parts: splitMatches(plan.title, words),
      detail: describeResultDetail(plan, matched, words),
      thumbnailUrl: plan.sermon.thumbnailUrl,
    })),
    noMatch: describeNoMatch(words),
    retry: () => void query.refetch(),
    /** Leaves the search for the plan, on Plans. */
    open: (planId: string) => {
      router.back();
      router.push(planOverviewHref(planId));
    },
    close: () => router.back(),
  } as const;
}
