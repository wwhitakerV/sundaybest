import type { Weekday } from "@/types/domain";

import type { AppAction } from "../actions";
import type { AppState } from "../state";
import { findById, withRecord } from "../table";
import { isLocalTime } from "../transitions";

type Action<Type extends AppAction["type"]> = Extract<AppAction, { type: Type }>;

export function updateReminderEnabled(
  state: AppState,
  action: Action<"settings/reminderEnabled">,
): AppState {
  const reminder = findById(state.reminders, action.reminderId);
  if (!reminder || reminder.enabled === action.enabled) return state;
  return {
    ...state,
    reminders: withRecord(state.reminders, {
      ...reminder,
      enabled: action.enabled,
      updatedAt: action.at,
    }),
  };
}

/** A reminder's time — a real 24-hour `HH:mm`, or nothing changes. */
export function updateReminderTime(
  state: AppState,
  action: Action<"settings/reminderTime">,
): AppState {
  const reminder = findById(state.reminders, action.reminderId);
  if (!reminder || !isLocalTime(action.time) || reminder.time === action.time) return state;
  return {
    ...state,
    reminders: withRecord(state.reminders, {
      ...reminder,
      time: action.time,
      updatedAt: action.at,
    }),
  };
}


export function updateReminderDays(
  state: AppState,
  action: Action<"settings/reminderDays">,
): AppState {
  const reminder = findById(state.reminders, action.reminderId);
  if (!reminder) return state;
  const allowed: readonly Weekday[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const unique = allowed.filter((day) => action.days.includes(day));
  if (unique.length === 0) return state;
  const unchanged =
    unique.length === reminder.days.length && unique.every((day, index) => reminder.days[index] === day);
  if (unchanged) return state;
  return {
    ...state,
    reminders: withRecord(state.reminders, { ...reminder, days: unique, updatedAt: action.at }),
  };
}

export function updateBibleTranslation(
  state: AppState,
  action: Action<"settings/bibleTranslation">,
): AppState {
  if (state.settings.bibleTranslation === action.translation) return state;
  return {
    ...state,
    settings: { ...state.settings, bibleTranslation: action.translation, updatedAt: action.at },
  };
}

export function updateTextSize(state: AppState, action: Action<"settings/textSize">): AppState {
  if (state.settings.textSize === action.textSize) return state;
  return {
    ...state,
    settings: { ...state.settings, textSize: action.textSize, updatedAt: action.at },
  };
}

/** How far the Daily Study's text may grow or shrink: 2pt a step, within reason. */
export const READING_TEXT_SIZE = { min: -4, max: 8, step: 2 } as const;

/** Whether `offset` is a size the study's text may take: on a step, within the limits. */
export function isReadingTextOffset(offset: number): boolean {
  const { min, max, step } = READING_TEXT_SIZE;
  return Number.isInteger(offset) && (offset - min) % step === 0 && offset >= min && offset <= max;
}

/** The Daily Study's text size — only on a step, and only within the limits. */
export function updateReadingTextOffset(
  state: AppState,
  action: Action<"settings/readingTextOffset">,
): AppState {
  const { offset } = action;
  if (!isReadingTextOffset(offset) || offset === state.settings.readingTextOffset) return state;
  return {
    ...state,
    settings: { ...state.settings, readingTextOffset: offset, updatedAt: action.at },
  };
}

/** The paper the Daily Study is read on. */
export function updateReadingPaper(
  state: AppState,
  action: Action<"settings/readingPaper">,
): AppState {
  if (state.settings.readingPaper === action.paper) return state;
  return {
    ...state,
    settings: { ...state.settings, readingPaper: action.paper, updatedAt: action.at },
  };
}


export function updateTheme(state: AppState, action: Action<"settings/theme">): AppState {
  if (state.settings.theme === action.theme) return state;
  return {
    ...state,
    settings: { ...state.settings, theme: action.theme, updatedAt: action.at },
  };
}

export function updateDefaultPlanLength(
  state: AppState,
  action: Action<"settings/defaultPlanLength">,
): AppState {
  if (state.settings.defaultPlanLength === action.lengthDays) return state;
  return {
    ...state,
    settings: { ...state.settings, defaultPlanLength: action.lengthDays, updatedAt: action.at },
  };
}

export function updateQuickCheckByDefault(
  state: AppState,
  action: Action<"settings/quickCheckByDefault">,
): AppState {
  if (state.settings.quickCheckByDefault === action.enabled) return state;
  return {
    ...state,
    settings: { ...state.settings, quickCheckByDefault: action.enabled, updatedAt: action.at },
  };
}

export function updateHapticsEnabled(
  state: AppState,
  action: Action<"settings/hapticsEnabled">,
): AppState {
  if (state.settings.hapticsEnabled === action.enabled) return state;
  return {
    ...state,
    settings: { ...state.settings, hapticsEnabled: action.enabled, updatedAt: action.at },
  };
}
