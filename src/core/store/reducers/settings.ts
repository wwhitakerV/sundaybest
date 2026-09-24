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
