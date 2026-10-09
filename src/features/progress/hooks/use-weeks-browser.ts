import { useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";

import { useWeeksQuery } from "@/core/api/reader-queries";
import { selectionFeedback, tapFeedback } from "@/core/haptics/haptics";
import { useAllReflectionAnswers } from "@/core/storage/reflection-answer-queries";
import { useToday } from "@/core/store";
import { planOverviewHref } from "@/entities/plan";
import { getWeekStartSunday } from "@/utils/dates/getWeekStartSunday";
import { parseWeeksParams, progressWeekHref } from "../logic/progress-route";
import { buildWeekCards, groupByMonth, searchWeekCards, yearsOf } from "../logic/week-history";
import { previewHistory, toPreview } from "../logic/week-picker-preview";

/**
 * The full-screen weeks' view model: every week a plan ran in as a card made
 * for remembering it — with the first thing written in it, from this phone —
 * found by year and a search within it, under their months. From a week: see it on
 * Progress, or open one of its plans. In development builds it can show a
 * made-up history instead.
 */
export function useWeeksBrowser() {
  const router = useRouter();
  const currentWeek = getWeekStartSunday(useToday());
  const preview = toPreview(parseWeeksParams(useLocalSearchParams()));
  const query = useWeeksQuery();
  const answers = useAllReflectionAnswers();
  const [search, setSearch] = useState("");
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
  const searching = search.trim().length > 0;
  // Past a year, the year picked narrows the list — a search too, within it, as its pill shows.
  const shownYear = years.length > 1 ? (year ?? years[0] ?? null) : null;
  const found = searchWeekCards(cards, search).filter(
    (card) => shownYear === null || card.year === shownYear,
  );

  return {
    loading: made === null && query.isPending,
    error: made === null && query.data === undefined ? query.error : null,
    retry: () => void query.refetch(),
    search,
    setSearch,
    years: years.length > 1 ? years : null,
    year: shownYear,
    pickYear: (next: string) => {
      if (next === shownYear) return;
      selectionFeedback();
      setYear(next);
    },
    months: groupByMonth(found),
    /** Searched and nothing found: says so, with what was searched. */
    noMatch: searching && found.length === 0 ? search.trim() : null,
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
      else router.push(planOverviewHref(planId));
    },
  } as const;
}
