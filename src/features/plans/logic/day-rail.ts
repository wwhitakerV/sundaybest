import type { PlanDay, StudyStep } from "@/types/domain";
import { formatShortDate } from "@/utils/dates/formatShortDate";
import { STUDY_STEPS } from "./study-steps";
import { formatDay } from "@/entities/plan";
import type { ApiQuickCheckStanding } from "@/core/api/contracts";

/**
 * Plan Detail's days: a row of tiles — where you are at a glance — and, for
 * the day picked, its four study steps and which are done, and its Quick Check.
 */

/** How a day's tile reads: its number, its date, its mark, and whether it's the day the plan's on. */
export type DayTileLook = {
  number: number;
  /** Its date, once the plan's schedule gives it one. */
  date: string | null;
  /** A check when done, a lock when not open yet — words never. */
  mark: "done" | "locked" | null;
  today: boolean;
  accessibilityLabel: string;
};

/** A day's tile: done (a check), locked (a lock), or the day the plan's on (`currentDayNumber`) — and dated, once scheduled. */
export function describeDayTile(
  day: Pick<PlanDay, "dayNumber" | "status" | "scheduledOn">,
  currentDayNumber: number | null,
  { locked = day.status === "locked" }: { locked?: boolean } = {},
): DayTileLook {
  const mark = day.status === "completed" ? "done" : locked ? "locked" : null;
  const today = mark === null && day.dayNumber === currentDayNumber;
  const date = day.scheduledOn ? formatShortDate(day.scheduledOn) : null;
  const standing = mark === "done" ? "done" : mark === "locked" ? "locked" : today ? "today" : null;
  const accessibilityLabel = [formatDay(day.dayNumber), standing, date]
    .filter((part) => part !== null)
    .join(", ");
  return { number: day.dayNumber, date, mark, today, accessibilityLabel };
}

/** Where a step stands: done, the next to do, still to come, not open yet, or locked with its day. */
type DayStepStatus = "done" | "current" | "upcoming" | "waiting" | "locked";

/** A step of a day — its four study steps, and its Quick Check if it has one. */
export type DayStepKey = StudyStep | "quickCheck";

/** One of a day's steps: what it's called, what it holds, where it stands, and whether it opens. */
type DayStepLook<Key extends DayStepKey, Status extends DayStepStatus> = {
  key: Key;
  label: string;
  detail: string | null;
  status: Status;
  /** Whether it can be opened — not while its day's locked, nor before it's open. */
  opens: boolean;
  /** What VoiceOver reads: "Read, done, Grace is received". */
  accessibilityLabel: string;
};

/** One of a day's four study steps — never waiting: each is open from the start of its day. */
export type StudyStepLook = DayStepLook<StudyStep, Exclude<DayStepStatus, "waiting">>;

/** A day's Quick Check, for after its study. */
export type QuickCheckLook = DayStepLook<"quickCheck", DayStepStatus>;

const STATUS_WORDS = new Map<DayStepStatus, string>([
  ["done", "done"],
  ["current", "next"],
  ["upcoming", "not done"],
  ["waiting", "not open yet"],
  ["locked", "locked"],
]);

function describeStep<Key extends DayStepKey, Status extends DayStepStatus>(
  key: Key,
  label: string,
  detail: string | null,
  status: Status,
): DayStepLook<Key, Status> {
  const accessibilityLabel = [label, STATUS_WORDS.get(status) ?? null, detail]
    .filter((part) => part !== null)
    .join(", ");
  const opens = status !== "locked" && status !== "waiting";
  return { key, label, detail, status, opens, accessibilityLabel };
}

function countQuestions(count: number): string {
  return `${count} ${count === 1 ? "question" : "questions"}`;
}

/**
 * A day's four steps, in the order they're studied, each with what it holds
 * — the reading's title, the passage, how many questions, a guided prayer —
 * and where it stands: done, the next to do (on the day the plan's on,
 * `today`), still to come, or — the day locked — locked, and none open.
 */
export function describeDaySteps(
  day: Pick<PlanDay, "status" | "completedSteps">,
  content: { readingTitle: string; scriptureReference: string | null; reflectionCount: number },
  { today, locked = day.status === "locked" }: { today: boolean; locked?: boolean },
): StudyStepLook[] {
  const { readingTitle, scriptureReference, reflectionCount } = content;
  const details = new Map<StudyStep, string | null>([
    ["read", readingTitle],
    ["scripture", scriptureReference],
    ["reflect", reflectionCount > 0 ? countQuestions(reflectionCount) : null],
    ["pray", "Guided prayer"],
  ]);
  const next = today
    ? STUDY_STEPS.find(({ key }) => !day.completedSteps.includes(key))?.key
    : undefined;
  return STUDY_STEPS.map(({ key, label }) => {
    const status: StudyStepLook["status"] = locked
      ? "locked"
      : day.completedSteps.includes(key)
        ? "done"
        : key === next
          ? "current"
          : "upcoming";
    return describeStep(key, label, details.get(key) ?? null, status);
  });
}

/**
 * A day's Quick Check, for after its study — none without one. It opens once
 * Pray is complete ("After Pray" till then); then it's the next thing to do,
 * with how many questions it asks, or how many are answered; taken, it's
 * done, with how many were right, and opens to look back on. A locked day's
 * is locked.
 */
export function describeQuickCheckStep(
  day: Pick<PlanDay, "status" | "completedSteps">,
  quiz: ApiQuickCheckStanding | null,
  { locked = day.status === "locked" }: { locked?: boolean } = {},
): QuickCheckLook | null {
  if (!quiz) return null;
  const { status, questionCount, answeredCount, correctCount } = quiz;
  const label = "Quick Check";
  if (locked) {
    return describeStep("quickCheck", label, countQuestions(questionCount), "locked");
  }
  if (status === "completed") {
    return describeStep("quickCheck", label, `${correctCount} of ${questionCount} correct`, "done");
  }
  if (!day.completedSteps.includes("pray")) {
    return describeStep("quickCheck", label, "After Pray", "waiting");
  }
  return describeStep(
    "quickCheck",
    label,
    status === "inProgress"
      ? `${answeredCount} of ${questionCount} answered`
      : countQuestions(questionCount),
    "current",
  );
}

/** How the picked day's header reads: whether it's locked, and the line under its title. */
export type DayHeaderLook = {
  locked: boolean;
  /** How long it takes, and — once there's any — how far through it is: "5 min · 2 of 4 done". */
  meta: string;
};

/**
 * The picked day's header, under its title: how long it takes, and how far
 * through its study `steps` it is once one's done — or, finished, when. It
 * never says which day it is: the row of days above does that.
 */
export function describeDayHeader(
  day: Pick<PlanDay, "status" | "completedAt">,
  {
    minutes,
    steps,
    locked = day.status === "locked",
  }: { minutes: number; steps: readonly Pick<StudyStepLook, "status">[]; locked?: boolean },
): DayHeaderLook {
  const length = `${minutes} min`;
  if (locked) return { locked: true, meta: length };
  if (day.status === "completed") {
    const finished = day.completedAt ? `Finished ${formatShortDate(day.completedAt)}` : "Finished";
    return { locked: false, meta: `${length} · ${finished}` };
  }
  const done = steps.filter(({ status }) => status === "done").length;
  return {
    locked: false,
    meta: done > 0 ? `${length} · ${done} of ${steps.length} done` : length,
  };
}

/**
 * How far to scroll the row of day tiles so the one at `index` sits in the
 * middle of the screen — never past either end, and not at all when the
 * row fits.
 */
export function getRailScrollOffset({
  index,
  count,
  tileWidth,
  gap,
  inset,
  viewportWidth,
}: {
  index: number;
  count: number;
  tileWidth: number;
  gap: number;
  inset: number;
  viewportWidth: number;
}): number {
  const contentWidth = inset * 2 + count * tileWidth + Math.max(0, count - 1) * gap;
  const maximum = Math.max(0, contentWidth - viewportWidth);
  const centred = inset + index * (tileWidth + gap) + tileWidth / 2 - viewportWidth / 2;
  return Math.min(maximum, Math.max(0, centred));
}

/** Where the day picked's tab sits along the row: past the `inset`, a day's `pitch` along for each before it. */
export function getRailTabX({
  index,
  pitch,
  inset,
}: {
  index: number;
  pitch: number;
  inset: number;
}): number {
  return inset + index * pitch;
}

/** What the row of days is headed: "6-day journey". */
export function getJourneyLabel(totalDays: number): string {
  return `${totalDays}-day journey`;
}
