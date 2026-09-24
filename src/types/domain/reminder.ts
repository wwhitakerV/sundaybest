import type { Entity, Id, LocalTime, Weekday } from "./common";

/**
 * - `dailyStudy` — time for today's study.
 * - `quickCheck` — a nudge to take the day's Quick Check.
 */
export type ReminderKind = "dailyStudy" | "quickCheck";

/** A local notification, from Settings → Daily reminder. */
export type Reminder = Entity & {
  userId: Id;
  kind: ReminderKind;
  /** The plan it's for, or null for whatever plan is active. */
  planId: Id | null;
  enabled: boolean;
  time: LocalTime;
  days: Weekday[];
};
