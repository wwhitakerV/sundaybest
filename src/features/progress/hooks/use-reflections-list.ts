import { useState } from "react";
import { usePreventZoomTransitionDismissal, useRouter } from "expo-router";

import { useReflectionPromptsQuery } from "@/core/api/reader-queries";
import { selectionFeedback } from "@/core/haptics/haptics";
import { useReflectionEntries, useReflectionLines } from "@/core/storage/reflection-answer-queries";
import { useToday } from "@/core/store";
import {
  buildReflections,
  describeListDate,
  groupByPlan,
  searchReflections,
} from "../logic/reflections";
import { wordsHref } from "../logic/progress-route";

/**
 * The list of every reflection written on this phone, full screen: under
 * their plans, the plan written in most lately first, each its question and
 * date — found by a search when one's open, its field on the keyboard. A row
 * opens Your words on it.
 */
export function useReflectionsList() {
  const router = useRouter();
  const today = useToday();
  const prompts = useReflectionPromptsQuery();
  const entries = useReflectionEntries();
  const { lines } = useReflectionLines();
  // Only the close leaves: no swipe down — the zoom's own included — ever dismisses it.
  usePreventZoomTransitionDismissal({ unstable_dismissalBoundsRect: { maxX: 0, maxY: 0 } });
  const [searching, setSearching] = useState(false);
  const [search, setSearch] = useState("");

  const reflections = buildReflections(prompts.data?.prompts ?? [], entries.data ?? [], lines);
  const found = searchReflections(reflections, search);

  return {
    loading: prompts.isPending || entries.isPending,
    error: prompts.data === undefined ? prompts.error : null,
    retry: () => void prompts.refetch(),
    plans: groupByPlan(found).map((plan) => ({
      planId: plan.planId,
      title: plan.title,
      thumbnailUrl: plan.thumbnailUrl,
      rows: plan.reflections.map((reflection) => ({
        id: reflection.id,
        question: reflection.question,
        date: describeListDate(reflection.writtenOn, today),
      })),
    })),
    /** Searched and nothing found: says so, with what was searched. */
    noMatch: search.trim().length > 0 && found.length === 0 ? search.trim() : null,
    /** The search is open: its field on the keyboard, the icon gone into the page. */
    searching,
    search,
    setSearch,
    openSearch: () => {
      selectionFeedback();
      setSearching(true);
    },
    /** The keyboard put away: with nothing typed, the field goes and the icon comes back. */
    leaveSearch: () => {
      if (search.trim().length === 0) {
        setSearching(false);
        setSearch("");
      }
    },
    open: (reflectionId: string) => router.navigate(wordsHref(reflectionId)),
    close: () => router.back(),
  } as const;
}
