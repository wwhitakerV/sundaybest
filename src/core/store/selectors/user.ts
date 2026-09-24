import type { Reminder, ReminderKind, User, UserSettings } from "@/types/domain";

import type { AppState } from "../state";
import { listAll } from "../table";

export function getCurrentUser(state: AppState): User {
  return state.user;
}

export function getUserSettings(state: AppState): UserSettings {
  return state.settings;
}

export function getReminders(state: AppState): Reminder[] {
  return listAll(state.reminders);
}

export function getReminder(state: AppState, kind: ReminderKind): Reminder | null {
  return getReminders(state).find((reminder) => reminder.kind === kind) ?? null;
}
