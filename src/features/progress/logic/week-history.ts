import type { ApiWeekHistory } from "@/core/api/contracts";
import { addDays } from "@/utils/dates/addDays";
import { describeRange } from "./week-view";

/** A sermon's artwork on a week's card: its image — a link, or a bundled one — on its colour. */
export type WeekArt = { source: string | number | null; colors: readonly string[] };

/** One plan in a week's card: its artwork, its title, and its church — to find and open it exactly. */
export type WeekCardPlan = { planId: string; title: string; church: string | null; art: WeekArt };

/** A week as its card shows it: every detail chosen to help the reader place it. */
export type WeekCard = {
  weekStart: string;
  current: boolean;
  /** "Oct 4 – 10", or "This week · Oct 4 – 10". */
  dates: string;
  month: string;
  year: string;
  /** Its plans, newest sermon first, each a row of its own. */
  plans: WeekCardPlan[];
  /** "4 of 7 days studied" — nothing on a week with none. */
  days: string | null;
  /** The first thing written that week, from this phone only. */
  wrote: string | null;
  /** Everything a search looks through — its sermons, churches, passages, and dates — lower-cased. */
  search: string;
};

function monthOf(weekStart: string): { month: string; year: string } {
  const date = new Date(`${weekStart}T00:00:00.000Z`);
  return {
    month: date.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" }),
    year: String(date.getUTCFullYear()),
  };
}

/**
 * The weeks as cards, newest first: each its dates, days studied, the first
 * thing written in it — answers read from this phone, `answers` by question —
 * and its plans, each with its artwork, title, and church.
 */
export function buildWeekCards(
  weeks: readonly ApiWeekHistory[],
  currentWeek: string,
  answers: Readonly<Record<string, string>>,
  artFor: (planId: string) => number | undefined = () => undefined,
): WeekCard[] {
  return weeks.map((week) => {
    const { month, year } = monthOf(week.weekStart);
    const range = describeRange(week.weekStart, addDays(week.weekStart, 6));
    const firstAnswer = week.plans
      .flatMap((plan) => plan.reflectionIds)
      .map((id) => answers[id]?.trim() ?? "")
      .find((answer) => answer.length > 0);

    return {
      weekStart: week.weekStart,
      current: week.weekStart === currentWeek,
      dates: week.weekStart === currentWeek ? `This week · ${range}` : range,
      month,
      year,
      plans: week.plans.map((plan) => ({
        planId: plan.planId,
        title: plan.title,
        church: plan.church,
        art: { source: artFor(plan.planId) ?? plan.thumbnailUrl, colors: plan.thumbnailColors },
      })),
      days: week.daysStudied > 0 ? `${week.daysStudied} of 7 days studied` : null,
      wrote: firstAnswer ? (firstAnswer.split("\n")[0] ?? null) : null,
      search: [
        range,
        month,
        ...week.plans.flatMap((plan) => [plan.title, plan.church ?? ""]),
        ...week.plans.flatMap((plan) => plan.passages.map((passage) => passage.reference)),
      ]
        .join(" ")
        .toLowerCase(),
    };
  });
}

/** The cards a search finds: those holding every word of it — a sermon, church, passage, book, or month. */
export function searchWeekCards(cards: readonly WeekCard[], query: string): WeekCard[] {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [...cards];
  return cards.filter((card) => words.every((word) => card.search.includes(word)));
}

/** The cards under their months, newest first: "October 2026". */
export function groupByMonth(
  cards: readonly WeekCard[],
): { month: string; year: string; cards: WeekCard[] }[] {
  const months: { month: string; year: string; cards: WeekCard[] }[] = [];
  for (const card of cards) {
    const last = months.at(-1);
    if (last?.month === card.month) last.cards.push(card);
    else months.push({ month: card.month, year: card.year, cards: [card] });
  }
  return months;
}

/** The years the weeks run across, newest first. */
export function yearsOf(cards: readonly WeekCard[]): string[] {
  return [...new Set(cards.map((card) => card.year))];
}
