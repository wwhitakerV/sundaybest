import { usePreventZoomTransitionDismissal, useRouter } from "expo-router";

import { useQuickChecksQuery } from "@/core/api/reader-queries";
import { selectionFeedback } from "@/core/haptics/haptics";
import { useEarnedSearch } from "@/core/storage/search-shown-queries";
import { quickCheckHref } from "@/entities/plan";
import { useListSearch } from "@/hooks/use-list-search";
import {
  QUICK_CHECKS_SEARCH_AT,
  groupQuickChecks,
  searchQuickChecks,
  toSearchable,
} from "../logic/recall";

/**
 * The list of every Quick Check finished, full screen: under their plans,
 * newest first, each its passage, day and how many it held — found by a
 * search, from ten, by plan or passage, its field on the keyboard. A row
 * opens that Quick Check's results. Only its close leaves.
 */
export function useQuickChecksList() {
  const router = useRouter();
  const query = useQuickChecksQuery();
  // No swipe down — the zoom's own included — ever dismisses it.
  usePreventZoomTransitionDismissal({ unstable_dismissalBoundsRect: { maxX: 0, maxY: 0 } });
  const search = useListSearch({ onOpen: selectionFeedback });

  const quickChecks = toSearchable(query.data?.quickChecks ?? []);
  const found = searchQuickChecks(quickChecks, search.query);
  const searchable = useEarnedSearch("quick-checks", quickChecks.length, QUICK_CHECKS_SEARCH_AT);
  const searched = search.query.trim();

  return {
    loading: query.isPending,
    error: query.data === undefined ? query.error : null,
    retry: () => void query.refetch(),
    plans: groupQuickChecks(found),
    /** Searched and nothing found: says so, with what was searched. */
    noMatch: searched.length > 0 && found.length === 0 ? searched : null,
    /** Enough Quick Checks to need a search: from ten, and from then on. */
    searchable,
    /** The search is open: its field on the keyboard, the icon gone into the page. */
    searching: search.searching,
    search: search.words,
    setSearch: search.setWords,
    openSearch: search.open,
    /** The keyboard put away: with nothing typed, the field goes and the icon comes back. */
    leaveSearch: search.leave,
    /** The search's own X: its words cleared, the field gone, the header's buttons back. */
    closeSearch: search.close,
    open: (planId: string, dayNumber: number) => router.push(quickCheckHref(planId, dayNumber)),
    close: () => router.back(),
  } as const;
}
