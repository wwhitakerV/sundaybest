import { useState } from "react";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";

import { useReflectionPromptsQuery } from "@/core/api/reader-queries";
import { selectionFeedback, tapFeedback } from "@/core/haptics/haptics";
import { useReflectionEntries, useReflectionLines } from "@/core/storage/reflection-answer-queries";
import { useToday } from "@/core/store";
import { studyHref } from "@/entities/plan";
import {
  TIMELINE_HINT,
  WORDS_EMPTY,
  buildMarks,
  buildReflections,
  chooseAnother,
  chooseOpening,
  describeAgo,
  describeFullDate,
  describeKept,
  describeTimelineEnds,
} from "../logic/reflections";
import { parseWordsParams } from "../logic/progress-route";

/**
 * Your words' view model: the reflections written on this phone, oldest
 * first, one in view — opened on an older one, to meet something forgotten —
 * the timeline's marks and the one in view, and the reflection's parts. Moves
 * between them by the timeline or "Another one" (never repeating one this
 * visit until all have been met); adds a line to the one in view, today's.
 */
export function useYourWords() {
  const router = useRouter();
  const navigation = useNavigation();
  const today = useToday();
  const prompts = useReflectionPromptsQuery();
  const entries = useReflectionEntries();
  const { lines, changeLine } = useReflectionLines();
  const reflections = buildReflections(prompts.data?.prompts ?? [], entries.data ?? [], lines);
  const marks = buildMarks(reflections);

  const [shownId, setShownId] = useState<string | null>(null);
  const [seen, setSeen] = useState<ReadonlySet<string>>(new Set());
  const [writing, setWriting] = useState(false);
  // Sent here from the list of them all: show that one. Each pick is applied once.
  const sent = parseWordsParams(useLocalSearchParams());
  const [applied, setApplied] = useState<string | null>(null);
  if (
    sent &&
    sent.at !== applied &&
    reflections.some((reflection) => reflection.id === sent.show)
  ) {
    setApplied(sent.at);
    setShownId(sent.show);
    setSeen((current) => new Set(current).add(sent.show));
    setWriting(false);
  }
  // The first time there's something to show, an older one is chosen to open on.
  if (shownId === null && reflections.length > 0) {
    const opening = chooseOpening(reflections, Math.random());
    setShownId(opening);
    if (opening) setSeen(new Set([opening]));
  }

  const index = Math.max(
    reflections.findIndex((reflection) => reflection.id === shownId),
    0,
  );
  const shown = reflections[index] ?? null;
  const show = (id: string | null) => {
    if (id === null || id === shown?.id) return;
    setShownId(id);
    setSeen((current) => new Set(current).add(id));
    setWriting(false);
  };
  const todayLine = shown?.lines.find((line) => line.writtenOn === today)?.text ?? "";

  return {
    loading: prompts.isPending || entries.isPending,
    error: prompts.data === undefined ? prompts.error : null,
    retry: () => void prompts.refetch(),
    kept: describeKept(reflections.length),
    timelineHint: TIMELINE_HINT,
    empty:
      !prompts.isPending && !entries.isPending && reflections.length === 0 ? WORDS_EMPTY : null,
    marks: marks.length,
    markShown: Math.max(
      marks.findIndex((mark) => mark.includes(index)),
      0,
    ),
    ends: describeTimelineEnds(reflections, today),
    shown: shown && {
      id: shown.id,
      ago: describeAgo(shown.writtenOn, today),
      date: describeFullDate(shown.writtenOn, today),
      question: shown.question,
      answer: shown.answer,
      reference: shown.reference,
      lines: shown.lines
        .filter((line) => line.writtenOn !== today || !writing)
        .map((line) => ({ ...line, date: describeFullDate(line.writtenOn, today) })),
    },
    /** A mark scrubbed to or tapped: the reflection it stands for (a week's newest). */
    showMark: (markIndex: number) => {
      const target = marks[markIndex]?.at(-1);
      const id = target === undefined ? null : (reflections[target]?.id ?? null);
      if (id === null || id === shown?.id) return;
      selectionFeedback();
      show(id);
    },
    canShowAnother: reflections.length > 1,
    showAnother: () => {
      tapFeedback();
      show(chooseAnother(reflections, shown?.id ?? null, seen, Math.random()));
    },
    /** Today's line to the one in view: being written, and its words. */
    writing,
    todayLine,
    startLine: () => {
      tapFeedback();
      setWriting(true);
    },
    changeLine: (text: string) => {
      if (shown) changeLine(shown.id, today, text);
    },
    endLine: () => setWriting(false),
    openStudy: () => {
      if (shown) router.push(studyHref(shown.planId, shown.dayNumber));
    },
    back: () => router.back(),
    /** The list of them all, zooming out of its button — once there's something in it. */
    listHref: reflections.length > 0 ? ("/reflections" as const) : null,
    /** The notebook pressed: its tap, as the link opens the list. */
    openList: () => tapFeedback(),
    /** A finger on the timeline holds the page's back swipe. */
    holdBackSwipe: (holding: boolean) => navigation.setOptions({ gestureEnabled: !holding }),
  } as const;
}
