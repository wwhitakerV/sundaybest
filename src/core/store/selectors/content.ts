import type { Id, Prayer, Reflection, ScripturePassage, SermonSource } from "@/types/domain";

import type { AppState } from "../state";
import { findById, listAll } from "../table";

export function getSermonById(state: AppState, sermonId: Id): SermonSource | null {
  return findById(state.sermons, sermonId);
}

/** The sermon a plan is built from. */
export function getSermonForPlan(state: AppState, planId: Id): SermonSource | null {
  const plan = findById(state.plans, planId);
  return plan ? findById(state.sermons, plan.sermonId) : null;
}

/** A day's Scripture passage. */
export function getScriptureForDay(state: AppState, dayId: Id): ScripturePassage | null {
  const day = findById(state.planDays, dayId);
  return day ? findById(state.scripture, day.scriptureId) : null;
}

/**
 * A day's Scripture as the user reads it: in their Bible translation
 * (Settings), where the passage is there in it — the same reference and
 * verses — and otherwise as the plan was built.
 */
export function getDayScripture(state: AppState, dayId: Id): ScripturePassage | null {
  const built = getScriptureForDay(state, dayId);
  const translation = state.settings.bibleTranslation;
  if (!built || built.translation === translation) return built;
  return (
    listAll(state.scripture).find(
      (passage) =>
        passage.translation === translation &&
        passage.book === built.book &&
        passage.chapter === built.chapter &&
        passage.verseStart === built.verseStart &&
        passage.verseEnd === built.verseEnd,
    ) ?? built
  );
}

/** A day's reflection questions, in order. */
export function getReflectionsForDay(state: AppState, dayId: Id): Reflection[] {
  return listAll(state.reflections)
    .filter((reflection) => reflection.planDayId === dayId)
    .sort((a, b) => a.order - b.order);
}

/** Reading pace for a day's text, words a minute — slower than skimming, as it's meant to be. */
const WORDS_PER_MINUTE = 150;
/** Time for the parts that aren't reading: sitting with the questions, praying. */
const PAUSE_MINUTES = 4;

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

/** About how long a day takes, in whole minutes: its words at a reading pace, plus time to reflect and pray. */
export function getDayMinutes(state: AppState, dayId: Id): number {
  const day = findById(state.planDays, dayId);
  if (!day) return 0;
  const texts = [
    ...day.reading.paragraphs,
    ...(getScriptureForDay(state, dayId)?.verses.map((verse) => verse.text) ?? []),
    ...getReflectionsForDay(state, dayId).map((reflection) => reflection.question),
    getPrayerForDay(state, dayId)?.text ?? "",
  ];
  const words = texts.reduce((total, text) => total + countWords(text), 0);
  return Math.round(words / WORDS_PER_MINUTE) + PAUSE_MINUTES;
}

export function getPrayerForDay(state: AppState, dayId: Id): Prayer | null {
  return listAll(state.prayers).find((prayer) => prayer.planDayId === dayId) ?? null;
}
