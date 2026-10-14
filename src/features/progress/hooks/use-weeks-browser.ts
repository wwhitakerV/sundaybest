import { useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";

import { useWeeksQuery } from "@/core/api/reader-queries";
import { selectionFeedback, tapFeedback } from "@/core/haptics/haptics";
import { useAllReflectionAnswers } from "@/core/storage/reflection-answer-queries";
import { useEarnedSearch } from "@/core/storage/search-shown-queries";
import { useToday } from "@/core/store";
import { placePlanHref } from "@/entities/tabs";
import { useListSearch } from "@/hooks/use-list-search";
import { getWeekStartSunday } from "@/utils/dates/getWeekStartSunday";
import { parseWeeksParams, progressWeekHref } from "../logic/progress-route";
import {
  WEEKS_SEARCH_AT,
  buildWeekCards,
  groupByMonth,
  searchWeekCards,
  yearsOf,
} from "../logic/week-history";
import { previewHistory, toPreview } from "../logic/week-picker-preview";

/**
 * The full-screen weeks' view model: every week a plan ran in as a card made
 * for remembering it — with the first thing written in it, from this phone —
 * found by year and, from eight weeks, a search within it on the keyboard,
 * under their months. From a week: see it on
 * Progress, or open one of its plans. In development builds it can show a
 * made-up history instead.
 */
export function useWeeksBrowser() {
  const router = useRouter();
  const currentWeek = getWeekStartSunday(useToday());
  const preview = toPreview(parseWeeksParams(useLocalSearchParams()));
  const query = useWeeksQuery();
  const answers = useAllReflectionAnswers();
  const search = useListSearch({ onOpen: selectionFeedback });
  const [year, setYear] = useState<string | null>(null);

  const made = preview === "real" ? null : previewHistory(preview, currentWeek);
  const history = made ? made.weeks : (query.data?.weeks ?? []);
  const cards = buildWeekCards(
    history,
    currentWeek,
    answers.data ?? {},
    (planId) => made?.art[planId],
  );
  const years = yearsOf(cards);
  const searched = search.query.trim();
  // Past a year, the year picked narrows the list — a search too, within it, as its pill shows.
  const shownYear = years.length > 1 ? (year ?? years[0] ?? null) : null;
  const found = searchWeekCards(cards, search.query).filter(
    (card) => shownYear === null || card.year === shownYear,
  );
  const searchable = useEarnedSearch("weeks", cards.length, WEEKS_SEARCH_AT);

  return {
    loading: made === null && query.isPending,
    error: made === null && query.data === undefined ? query.error : null,
    retry: () => void query.refetch(),
    /** Enough weeks to need a search: from eight, and from then on. */
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
    years: years.length > 1 ? years : null,
    year: shownYear,
    pickYear: (next: string) => {
      if (next === shownYear) return;
      selectionFeedback();
      setYear(next);
    },
    months: groupByMonth(found),
    /** Searched and nothing found: says so, with what was searched. */
    noMatch: searched.length > 0 && found.length === 0 ? searched : null,
    close: () => router.back(),
    /** Back to Progress on this week — on one of its plans, when one was picked. */
    seeWeek: (weekStart: string, planId?: string) => {
      selectionFeedback();
      if (made) router.back();
      else router.navigate(progressWeekHref(weekStart, planId));
    },
    openPlan: (planId: string) => {
      tapFeedback();
      // A made-up week's plan isn't anywhere to go.
      if (made) router.back();
      // On top of Weeks, in one movement: Back returns to the weeks, where the reader was.
      else router.push(placePlanHref("over", planId));
    },
  } as const;
}
