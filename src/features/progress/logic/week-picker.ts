import type { ApiWeek } from "@/core/api/contracts";

/**
 * Up to this many weeks, the dates open a short list in a popover; past it,
 * the full-screen weeks, made for finding one again.
 */
export const POPOVER_MOST = 4;

/** One week in the popover: how long ago, and what it held under. */
export type WeekOption = {
  weekStart: string;
  /** "This week", "Last week", "3 weeks ago". */
  label: string;
  /** Under it: its newest sermon's title — or nothing yet, on a week with none. */
  title: string | null;
  /** How many more plans it held: shown "+2 more", beside the title. */
  more: number;
};

/** How long ago a week was, from this one: "This week", "Last week", "3 weeks ago". */
export function describeWeeksAgo(weekStart: string, currentWeek: string): string {
  const days =
    (Date.parse(`${currentWeek}T00:00:00Z`) - Date.parse(`${weekStart}T00:00:00Z`)) / 86_400_000;
  const weeks = Math.round(days / 7);
  if (weeks <= 0) return "This week";
  return weeks === 1 ? "Last week" : `${weeks} weeks ago`;
}

/**
 * The weeks the popover lists, newest first — this week always first,
 * whatever it holds — each by how long ago it was, with what it held under:
 * its newest sermon's title, and how many more.
 */
export function getWeekOptions(weeks: ApiWeek["weeks"], currentWeek: string): WeekOption[] {
  const option = (weekStart: string, held: ApiWeek["weeks"][number] | undefined): WeekOption => ({
    weekStart,
    label: describeWeeksAgo(weekStart, currentWeek),
    title: held?.title ?? null,
    more: held ? held.planCount - 1 : 0,
  });
  const thisWeek = option(
    currentWeek,
    weeks.find((week) => week.weekStart === currentWeek),
  );
  const past = weeks
    .filter((week) => week.weekStart < currentWeek)
    .map((week) => option(week.weekStart, week));
  return [thisWeek, ...past];
}

/** The week before this one that the reader can go to — the next older week a plan ran in. */
export function getOlderWeek(weeks: ApiWeek["weeks"], weekStart: string): string | null {
  return weeks.find((week) => week.weekStart < weekStart)?.weekStart ?? null;
}

/** The week after this one they can go to: the next newer week a plan ran in, or this week. */
export function getNewerWeek(
  weeks: ApiWeek["weeks"],
  weekStart: string,
  currentWeek: string,
): string | null {
  if (weekStart >= currentWeek) return null;
  const newer = weeks.filter((week) => week.weekStart > weekStart && week.weekStart < currentWeek);
  return newer.at(-1)?.weekStart ?? currentWeek;
}
