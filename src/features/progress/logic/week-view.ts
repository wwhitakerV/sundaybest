import type { ApiWeek, ApiWeekDay, ApiWeekPassage } from "@/core/api/contracts";
import { formatDay } from "@/entities/plan";
import type { DayTileLook } from "@/ui/molecules/DayTile";

const NUMBER_WORDS = [
  "Zero",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
];

/** A count of plans in words: "Three plans". */
function describePlanCount(count: number): string {
  return `${NUMBER_WORDS[count] ?? count} plans`;
}

/** A calendar date (`2026-10-04`) read as UTC, as dates are kept. */
function at(date: string): Date {
  return new Date(`${date}T00:00:00.000Z`);
}

function format(date: string, options: Intl.DateTimeFormatOptions): string {
  return at(date).toLocaleDateString("en-US", { ...options, timeZone: "UTC" });
}

/** A date's weekday in full: "Tuesday". */
export function weekdayName(date: string): string {
  return format(date, { weekday: "long" });
}

/**
 * Where the week's study comes from, small over its title: one plan's church
 * ("From VOUS Church", or "From the sermon" when it isn't known), or how many
 * plans ("Three plans"). Nothing for a week with none.
 */
export function describeSource(header: ApiWeek["header"]): string | null {
  if (header.planCount === 0) return null;
  if (header.planCount === 1) return header.church ? `From ${header.church}` : "From the sermon";
  return describePlanCount(header.planCount);
}

/** The week's title: its one plan's, or "This week" for several — or none. */
export function describeTitle(header: ApiWeek["header"]): string {
  return header.planCount === 1 && header.title ? header.title : "This week";
}

/** The week's dates, Sunday to Saturday: "Oct 4 – 10", or "Sep 27 – Oct 3" across two months. */
export function describeRange(weekStart: string, weekEnd: string): string {
  const start = format(weekStart, { month: "short", day: "numeric" });
  const end =
    weekStart.slice(0, 7) === weekEnd.slice(0, 7)
      ? String(at(weekEnd).getUTCDate())
      : format(weekEnd, { month: "short", day: "numeric" });
  return `${start} – ${end}`;
}

/**
 * A day's tile in the week, every one on the soft fill: its date's number,
 * its weekday's initial under it; checked once studied, a dash on a past day
 * not studied, the red dot today, quieter while it's ahead.
 */
export function describeWeekTile(day: ApiWeekDay): DayTileLook {
  const standing = {
    studied: "studied",
    today: "today",
    notStudied: "not studied",
    upcoming: "ahead",
  }[day.state];
  return {
    number: at(day.date).getUTCDate(),
    date: format(day.date, { weekday: "narrow" }),
    mark: day.state === "studied" ? "done" : day.state === "notStudied" ? "missed" : null,
    today: day.state === "today",
    muted: day.state === "upcoming",
    filled: true,
    accessibilityLabel: [
      weekdayName(day.date),
      format(day.date, { month: "long", day: "numeric" }),
      standing,
    ]
      .filter((part) => part !== null)
      .join(", "),
  };
}

/**
 * The day picked when a week opens: today on this week; on a past week, its
 * latest studied day, or its last day when none was studied.
 */
export function openingDay(days: readonly ApiWeekDay[], today: string): string {
  if (days.some((day) => day.date === today)) return today;
  const studied = days.filter((day) => day.state === "studied").at(-1);
  return studied?.date ?? days.at(-1)?.date ?? today;
}

/** The passage a day opens on: today, its first not done yet; any other day, its first. */
export function openingPassage(day: ApiWeekDay, today: string): number {
  if (day.date !== today) return 0;
  return Math.max(
    0,
    day.passages.findIndex((passage) => passage.status !== "done"),
  );
}

/** What the panel shows for the passage in view, and its words. */
export type PanelLook =
  | { kind: "verse"; verse: string | null }
  | { kind: "message"; title: string; line: string | null; action: string | null };

/**
 * The panel for a day's passage, by where it stands: a passage done shows
 * its key verse; today's, ready when they are; a past day's unread one, still
 * here with nothing to catch up on; one whose plan's day before it isn't done,
 * when it opens; a day ahead, the day it opens. A day with no passage: nothing
 * planned — or, with no plan at all, where to begin.
 */
export function describePanel(
  day: ApiWeekDay,
  passage: ApiWeekPassage | undefined,
  { today, anyPlan }: { today: string; anyPlan: boolean },
): PanelLook {
  if (!passage) {
    return anyPlan
      ? { kind: "message", title: "Nothing was planned for this day.", line: null, action: null }
      : {
          kind: "message",
          title: "Your week starts with a sermon.",
          line: "Add one with the + button, and its study will gather here day by day.",
          action: null,
        };
  }
  if (passage.status === "done") return { kind: "verse", verse: passage.keyVerse?.text ?? null };
  if (passage.status === "upcoming") {
    return { kind: "message", title: `Opens ${weekdayName(day.date)}.`, line: null, action: null };
  }
  if (passage.status === "waiting") {
    return {
      kind: "message",
      title: `Opens after ${formatDay(passage.dayNumber - 1)}.`,
      line: null,
      action: null,
    };
  }
  if (day.date === today) {
    return {
      kind: "message",
      title: "Ready when you are.",
      line: "A passage, a few questions, a prayer.",
      action: "Begin this study",
    };
  }
  return {
    kind: "message",
    title: "This one is still here.",
    line: "There's nothing to catch up on. Read it whenever you like.",
    action: `Read ${weekdayName(day.date)}'s passage`,
  };
}

/** The label over the panel: "Today", or the day's name. */
export function describeDayLabel(date: string, today: string): string {
  return date === today ? "Today" : weekdayName(date);
}

function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

/** The Word's line: "23 passages across 9 books". */
export function describeWord(passages: number, books: number): string {
  return `${plural(passages, "passage", "passages")} across ${plural(books, "book", "books")}`;
}

/** Your words' line: "17 reflections, kept on this phone" — or, before the first, where they'll stay. */
export function describeWords(count: number): string {
  if (count === 0) return "Your reflections stay on this phone";
  return `${plural(count, "reflection", "reflections")}, kept on this phone`;
}

/** Quick Check's line, as its page says it: "14 correct · 4 to revisit". */
export function describeQuickCheck(right: number, missed: number): string {
  return `${right} correct · ${missed} to revisit`;
}

/**
 * Where a week opens on one of its plans, picked from the weeks: that plan's
 * latest day read that week — or, with none read, its first day there — on
 * that plan's passage. Null when the plan has no day in the week.
 */
export function focusOnPlan(
  days: readonly ApiWeekDay[],
  planId: string,
): { date: string; passage: number } | null {
  const withPlan = days.flatMap((day) => {
    const passage = day.passages.findIndex((candidate) => candidate.planId === planId);
    return passage === -1 ? [] : [{ day, passage }];
  });
  const read = withPlan
    .filter(({ day, passage }) => day.passages[passage]?.status === "done")
    .at(-1);
  const chosen = read ?? withPlan[0];
  return chosen ? { date: chosen.day.date, passage: chosen.passage } : null;
}
