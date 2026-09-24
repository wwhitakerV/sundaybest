import type { Entity, Id, IsoDate, IsoDateTime } from "./common";
import type { SermonClip } from "./sermon";

/** A plan runs 1 to 7 days. Never assume every plan is the same length. */
export type PlanLength = 1 | 2 | 3 | 4 | 5 | 6 | 7;

/**
 * - `draft` — being set up in New Plan.
 * - `generating` — being built from its sermon (see `PlanGeneration`).
 * - `ready` — built, not started.
 * - `active` — under way.
 * - `completed` — every day done.
 * - `archived` — put away by the user.
 */
export type PlanStatus = "draft" | "generating" | "ready" | "active" | "completed" | "archived";

/** A multi-day study built from one sermon. */
export type Plan = Entity & {
  userId: Id;
  sermonId: Id;
  title: string;
  status: PlanStatus;
  lengthDays: PlanLength;
  /** Whether it includes a Quick Check quiz. */
  quickCheckEnabled: boolean;
  /** The first day of the plan, once started. */
  startDate: IsoDate | null;
  startedAt: IsoDateTime | null;
  completedAt: IsoDateTime | null;
  archivedAt: IsoDateTime | null;
};

/**
 * - `locked` — not reachable yet.
 * - `available` — ready to start.
 * - `inProgress` — started, not finished.
 * - `completed` — every step done.
 */
export type PlanDayStatus = "locked" | "available" | "inProgress" | "completed";

/** The Daily Study's steps, in order. */
export type StudyStep = "read" | "scripture" | "reflect" | "pray";

/** A day's Read step: a short reading, and the part of the sermon it comes from. */
export type DayReading = {
  title: string;
  paragraphs: string[];
  /** A line from the sermon the reading draws on, quoted as said. */
  sermonQuote: string | null;
  sermonClip: SermonClip | null;
};

/**
 * One day of a plan. Its Scripture, reflection questions, prayer, and quiz
 * are separate entities that point back to it (`planDayId`).
 */
export type PlanDay = Entity & {
  planId: Id;
  /** 1-indexed, 1 through the plan's `lengthDays`. */
  dayNumber: number;
  status: PlanDayStatus;
  reading: DayReading;
  scriptureId: Id;
  /** The steps finished so far, in the order they were finished. */
  completedSteps: StudyStep[];
  /**
   * `completedAt` is the day's completion record: progress, streaks, and
   * weekly counts are all worked out from it.
   */
  /** The day it's meant for, once the plan has started. */
  scheduledOn: IsoDate | null;
  startedAt: IsoDateTime | null;
  completedAt: IsoDateTime | null;
};
