import type { Entity, Id, IsoDate } from "./common";

/** How far through a plan the user is. */
export type PlanProgress = Entity & {
  planId: Id;
  /** The day they're on, 1-indexed. */
  currentDayNumber: number;
  /** Days finished, 1-indexed. */
  completedDayNumbers: number[];
};

/** The user's progress across every plan: their streak and totals. */
export type UserProgress = Entity & {
  userId: Id;
  /** Days in a row with a finished study day, up to today. */
  currentStreakDays: number;
  longestStreakDays: number;
  /** The last day a study day was finished; null before the first. */
  lastStudiedOn: IsoDate | null;
  /** Every calendar day a study day was finished — the week strip's filled circles. */
  studiedOn: IsoDate[];
  completedDayCount: number;
  completedPlanCount: number;
};
