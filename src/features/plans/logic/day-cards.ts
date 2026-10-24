import type { ApiPlanDetail } from "@/core/api/contracts";
import { formatDay } from "@/entities/plan";
import { formatShortDate } from "@/utils/dates/formatShortDate";

type ApiPlanDay = ApiPlanDetail["days"][number];

/** Where a day stands: done, the one the plan's on, open, or not open yet. */
type DayState = "done" | "today" | "open" | "locked";

/** A day's card in a plan page's days: what it is, where it stands, and whether it opens. */
export type DayCardLook = {
  dayNumber: number;
  /** "DAY 3". */
  label: string;
  title: string;
  /** "9 min". */
  length: string;
  state: DayState;
  /** Where it stands, in the label's capitals — "DONE", "TODAY", "OPENS OCT 24" — or none. */
  standing: string | null;
  /** Tapped, it opens its study: never while it isn't open yet. */
  opens: boolean;
  accessibilityLabel: string;
};

/** How a day stands, the plan on `currentDayNumber`. */
function stateOf(day: ApiPlanDay, currentDayNumber: number | null): DayState {
  if (day.progress.status === "completed") return "done";
  if (day.progress.status === "locked") return "locked";
  return day.dayNumber === currentDayNumber ? "today" : "open";
}

/** A day's standing, in words: done, today, or when it opens. */
function standingOf(day: ApiPlanDay, state: DayState): string | null {
  if (state === "done") return "DONE";
  if (state === "today") return "TODAY";
  if (state === "locked") {
    return day.progress.scheduledOn
      ? `OPENS ${formatShortDate(day.progress.scheduledOn).toUpperCase()}`
      : "NOT OPEN YET";
  }
  return null;
}

/** A plan's days as its page's cards show them, in order. */
export function describeDayCards(
  days: readonly ApiPlanDay[],
  currentDayNumber: number | null,
): DayCardLook[] {
  return days.map((day) => {
    const state = stateOf(day, currentDayNumber);
    const standing = standingOf(day, state);
    const label = formatDay(day.dayNumber).toUpperCase();
    const length = `${day.estimatedMinutes} min`;
    return {
      dayNumber: day.dayNumber,
      label,
      title: day.reading.title,
      length,
      state,
      standing,
      opens: state !== "locked",
      accessibilityLabel: [
        formatDay(day.dayNumber),
        day.reading.title,
        length,
        standing?.toLowerCase(),
      ]
        .filter(Boolean)
        .join(", "),
    };
  });
}
