import { useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";

import { useWeekQuery } from "@/core/api/reader-queries";
import { flags } from "@/core/config/flags";
import { selectionFeedback, tapFeedback } from "@/core/haptics/haptics";
import { useReflectionTotal } from "@/core/storage/reflection-answer-queries";
import { useToday } from "@/core/store";
import { studyHref } from "@/entities/plan";
import { addDays } from "@/utils/dates/addDays";
import { getWeekStartSunday } from "@/utils/dates/getWeekStartSunday";
import {
  describeDayLabel,
  describePanel,
  describeRange,
  describeSource,
  describeQuickCheck,
  describeTitle,
  describeWeekTile,
  describeWord,
  describeWords,
  focusOnPlan,
  openingDay,
  openingPassage,
} from "../logic/week-view";
import { POPOVER_MOST, getNewerWeek, getOlderWeek, getWeekOptions } from "../logic/week-picker";
import {
  PICKER_PREVIEW_NAMES,
  nextPreview,
  previewHistory,
  toPickerWeeks,
  type PickerPreview,
} from "../logic/week-picker-preview";
import { parseProgressParams, weeksHref } from "../logic/progress-route";

type Selection = { weekStart: string; date: string; passage: number };
/** A plan to open a week on, picked from the full-screen weeks. */
type Focus = { weekStart: string; planId: string };

/**
 * Progress's view model: the week on screen — its source, title, and dates —
 * its seven days and the one picked, the picked day's passages and the one in
 * view, what the panel says for it (and what the reader wrote, from this
 * phone), and the reader's all-time rows. Moves between weeks, days, and
 * passages; opens a passage's study.
 */
export function useWeekView() {
  const router = useRouter();
  const today = useToday();
  const currentWeek = getWeekStartSunday(today);
  const [weekStart, setWeekStart] = useState(currentWeek);
  const [selection, setSelection] = useState<Selection | null>(null);
  // Development builds only: the picker shown with a made-up history, to look at it as it grows.
  const [preview, setPreview] = useState<PickerPreview>("real");
  const [focus, setFocus] = useState<Focus | null>(null);

  // Sent here from the full-screen weeks: go to that week, on its plan. Each pick is applied once.
  const sent = parseProgressParams(useLocalSearchParams());
  const [applied, setApplied] = useState<string | null>(null);
  if (sent && sent.at !== applied) {
    setApplied(sent.at);
    setWeekStart(sent.week);
    setSelection(null);
    setFocus(sent.plan ? { weekStart: sent.week, planId: sent.plan } : null);
  }
  const query = useWeekQuery(weekStart);
  const totalQuery = useReflectionTotal();
  const week = query.data;

  // Each week opens on its own day — or on the plan it was picked for — until the reader picks one.
  const focused =
    week && focus?.weekStart === week.weekStart ? focusOnPlan(week.days, focus.planId) : null;
  const fallbackDate = focused?.date ?? (week ? openingDay(week.days, week.today) : today);
  // The reader's pick holds only on the week it was made in.
  const picked =
    selection && week && selection.weekStart === week.weekStart
      ? selection
      : focused && week
        ? { weekStart: week.weekStart, ...focused }
        : null;
  const date = picked?.date ?? fallbackDate;
  const day = week?.days.find((candidate) => candidate.date === date) ?? null;
  const passageIndex = picked ? picked.passage : day && week ? openingPassage(day, week.today) : 0;
  const weeks = week?.weeks ?? [];
  const anyPlan = weeks.length > 0;
  const pages =
    day && week
      ? (day.passages.length > 0 ? day.passages : [undefined]).map((candidate) => ({
          passage: candidate,
          panel: describePanel(day, candidate, { today: week.today, anyPlan }),
        }))
      : [];

  const older = getOlderWeek(weeks, weekStart);
  const newer = getNewerWeek(weeks, weekStart, currentWeek);
  const pickerWeeks =
    preview === "real" ? weeks : toPickerWeeks(previewHistory(preview, currentWeek).weeks);
  const goTo = (next: string | null) => {
    if (next === null || next === weekStart) return;
    selectionFeedback();
    setWeekStart(next);
  };
  const pick = (next: Partial<Selection>) => {
    if (!week) return;
    setSelection({ weekStart: week.weekStart, date, passage: passageIndex, ...next });
  };
  const open = (planId: string, dayNumber: number) => {
    tapFeedback();
    router.push(studyHref(planId, dayNumber));
  };

  return {
    loading: query.isPending,
    error: query.data === undefined ? query.error : null,
    retry: () => void query.refetch(),
    header: week
      ? {
          source: describeSource(week.header),
          title: describeTitle(week.header),
          range: describeRange(week.weekStart, addDays(week.weekStart, 6)),
        }
      : null,
    tiles:
      week?.days.map((candidate) => ({
        date: candidate.date,
        look: describeWeekTile(candidate),
      })) ?? [],
    selectedDate: date,
    dayLabel: describeDayLabel(date, week?.today ?? today),
    isToday: date === (week?.today ?? today),
    /** The reader's Bible translation, beside each passage's reference. */
    translation: week?.translation ?? "",
    pages,
    passageIndex,
    rows: week
      ? {
          word:
            week.summary.passageCount > 0
              ? describeWord(week.summary.passageCount, week.summary.bookCount)
              : null,
          words: describeWords(totalQuery.data ?? 0),
          quickCheck:
            week.summary.right + week.summary.missed > 0
              ? describeQuickCheck(week.summary.right, week.summary.missed)
              : null,
          onOpenWord: () => router.push("/progress/word"),
          onOpenWords: () => router.push("/progress/words"),
          onOpenQuickCheck: () => router.push("/progress/quick-check"),
        }
      : null,
    canGoBack: older !== null,
    canGoForward: newer !== null,
    /**
     * The week picker: a few weeks in a popover — or, past four, the
     * full-screen weeks — and the week showing.
     */
    picker:
      pickerWeeks.filter((candidate) => candidate.weekStart < currentWeek).length > POPOVER_MOST
        ? ({ mode: "browse", href: weeksHref(preview === "real" ? null : preview) } as const)
        : ({
            mode: "popover",
            options: getWeekOptions(pickerWeeks, currentWeek),
            selected: weekStart,
          } as const),
    selectDay: (next: string) => {
      if (next === date || !week) return;
      selectionFeedback();
      const nextDay = week.days.find((candidate) => candidate.date === next);
      pick({ date: next, passage: nextDay ? openingPassage(nextDay, week.today) : 0 });
    },
    showPassage: (index: number) => {
      if (index === passageIndex) return;
      pick({ passage: index });
    },
    previousWeek: () => goTo(older),
    nextWeek: () => goTo(newer),
    // A made-up week has nothing to show: picking one only closes the picker.
    pickWeek: (next: string) => {
      if (preview === "real") goTo(next);
    },
    /** In development builds: which history the picker shows, and the next. */
    pickerPreview: flags.isEnabled("designPreviews")
      ? {
          name: PICKER_PREVIEW_NAMES[preview],
          next: () => setPreview((current) => nextPreview(current)),
        }
      : null,
    open,
  } as const;
}
