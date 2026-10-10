import type { ApiMyReflectionPrompt } from "@/core/api/contracts";
import { getWeekStartSunday } from "@/utils/dates/getWeekStartSunday";

/** A line added later to what was written: the day, and its words. */
export type AddedLine = { writtenOn: string; text: string };

/** One written answer to one question in a study, with what's been added to it since. */
export type Reflection = {
  id: string;
  question: string;
  reference: string;
  planId: string;
  planTitle: string;
  /** The plan's sermon's artwork, to know it by. */
  thumbnailUrl: string | null;
  dayNumber: number;
  answer: string;
  /** The day it was written, on this phone's calendar. */
  writtenOn: string;
  lines: AddedLine[];
};

/** As many marks as the timeline shows one by one; past this, each mark is a week. */
export const MOST_MARKS = 40;

/** How to use the timeline, under the page's line, while there is one. */
export const TIMELINE_HINT = "The timeline is interactive. You can tap, or press-and-slide.";

/** What the page says before anything is written: what it's for, and how it fills. */
export const WORDS_EMPTY = {
  title: "Nothing written yet",
  message: "What you write in a study is kept here.",
} as const;

const SMALL = ["One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"];
const spell = (count: number) => SMALL[count - 1] ?? String(count);

/** A moment's day on this phone's calendar: "2026-08-27". */
export function toLocalDate(iso: string): string {
  const date = new Date(iso);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/**
 * The reader's reflections, oldest first: each answer written on this phone,
 * matched with the question it answers, its passage and study, and the lines
 * added to it since. An answer whose question isn't in their plans any more
 * isn't shown.
 */
export function buildReflections(
  prompts: readonly ApiMyReflectionPrompt[],
  entries: readonly { reflectionId: string; answer: string; answeredAt: string }[],
  lines: Readonly<Record<string, readonly AddedLine[]>>,
): Reflection[] {
  const byId = new Map(prompts.map((prompt) => [prompt.id, prompt]));
  return [...entries]
    .sort((a, b) => a.answeredAt.localeCompare(b.answeredAt))
    .flatMap((entry) => {
      const prompt = byId.get(entry.reflectionId);
      return prompt
        ? [
            {
              id: prompt.id,
              question: prompt.question,
              reference: prompt.reference,
              planId: prompt.planId,
              planTitle: prompt.planTitle,
              thumbnailUrl: prompt.thumbnailUrl,
              dayNumber: prompt.dayNumber,
              answer: entry.answer,
              writtenOn: toLocalDate(entry.answeredAt),
              lines: [...(lines[prompt.id] ?? [])],
            },
          ]
        : [];
    });
}

const at = (date: string) => new Date(`${date}T00:00:00Z`);
const daysBetween = (from: string, to: string) =>
  Math.round((at(to).getTime() - at(from).getTime()) / 86_400_000);

/** How long ago something was written: "Today", "Yesterday", "This week", "Six weeks ago". */
export function describeAgo(writtenOn: string, today: string): string {
  const days = daysBetween(writtenOn, today);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  const weeks = Math.round(
    daysBetween(getWeekStartSunday(writtenOn), getWeekStartSunday(today)) / 7,
  );
  if (weeks === 0) return "This week";
  if (weeks === 1) return "Last week";
  if (weeks < 9) return `${spell(weeks)} weeks ago`;
  const months = Math.floor(days / 30.44);
  if (months < 12) return `${spell(months)} months ago`;
  const years = Math.floor(days / 365.25);
  return years === 1 ? "A year ago" : `${spell(years)} years ago`;
}

/** Its full date: "Thursday, August 27" — with the year when it isn't this one. */
export function describeFullDate(writtenOn: string, today: string): string {
  return at(writtenOn).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    ...(writtenOn.slice(0, 4) !== today.slice(0, 4) && { year: "numeric" }),
    timeZone: "UTC",
  });
}

/** The page's line under its title: "17 reflections. They never leave this phone." — before any, just the promise. */
export function describeKept(count: number): string {
  if (count === 0) return "What you write never leaves this phone.";
  return count === 1
    ? "1 reflection. It never leaves this phone."
    : `${count} reflections. They never leave this phone.`;
}

/**
 * The timeline's marks, oldest first, each the reflections it stands for:
 * one apiece — or, past `MOST_MARKS`, one for each week written in.
 */
export function buildMarks(reflections: readonly Reflection[]): number[][] {
  if (reflections.length <= MOST_MARKS) return reflections.map((_, index) => [index]);
  const weeks = new Map<string, number[]>();
  reflections.forEach((reflection, index) => {
    const week = getWeekStartSunday(reflection.writtenOn);
    weeks.set(week, [...(weeks.get(week) ?? []), index]);
  });
  return [...weeks.values()];
}

const monthOf = (date: string) =>
  at(date).toLocaleDateString("en-US", { month: "long", timeZone: "UTC" });

/** The timeline's ends: the first one's month; "This week" for the newest if it's this week's, else its month. */
export function describeTimelineEnds(
  reflections: readonly Reflection[],
  today: string,
): { start: string; end: string } | null {
  const first = reflections[0];
  const last = reflections.at(-1);
  if (!first || !last) return null;
  return {
    start: monthOf(first.writtenOn),
    end:
      getWeekStartSunday(last.writtenOn) === getWeekStartSunday(today)
        ? "This week"
        : monthOf(last.writtenOn),
  };
}

/**
 * Another one to meet — a reflection, a missed question — oldest first in
 * the list given: never the one showing, nor one already met this visit
 * until all have been; leaning toward older ones, the older the likelier.
 * `random` is in [0, 1).
 */
export function chooseAnother(
  reflections: readonly { id: string }[],
  currentId: string | null,
  seen: ReadonlySet<string>,
  random: number,
): string | null {
  const others = reflections.filter((reflection) => reflection.id !== currentId);
  if (others.length === 0) return currentId;
  const fresh = others.filter((reflection) => !seen.has(reflection.id));
  const pool = fresh.length > 0 ? fresh : others;
  // Oldest first, so the first is weighted most: n, n-1, … 1.
  const weights = pool.map((_, index) => pool.length - index);
  let target = random * weights.reduce((sum, weight) => sum + weight, 0);
  for (const [index, reflection] of pool.entries()) {
    target -= weights[index] ?? 0;
    if (target < 0) return reflection.id;
  }
  return pool.at(-1)?.id ?? null;
}

/** The one the page opens on: an older one, chosen as "Another one" chooses — never the newest when there's more than one. */
export function chooseOpening(reflections: readonly Reflection[], random: number): string | null {
  const newest = reflections.at(-1);
  if (!newest) return null;
  return reflections.length === 1
    ? newest.id
    : chooseAnother(reflections, newest.id, new Set(), random);
}

/** A reflection's date in a list: "Aug 27" — with the year when it isn't this one. */
export function describeListDate(writtenOn: string, today: string): string {
  return at(writtenOn).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(writtenOn.slice(0, 4) !== today.slice(0, 4) && { year: "numeric" }),
    timeZone: "UTC",
  });
}

/** The reflections a search finds: by their question, what was written, its passage, or its plan. */
export function searchReflections(reflections: readonly Reflection[], words: string): Reflection[] {
  const needle = words.trim().toLowerCase();
  if (needle.length === 0) return [...reflections];
  return reflections.filter((reflection) =>
    [
      reflection.question,
      reflection.answer,
      reflection.reference,
      reflection.planTitle,
      ...reflection.lines.map((line) => line.text),
    ].some((text) => text.toLowerCase().includes(needle)),
  );
}

/** Reflections under their plans: the plan written in most lately first, its newest first. */
export function groupByPlan(reflections: readonly Reflection[]): {
  planId: string;
  title: string;
  thumbnailUrl: string | null;
  reflections: Reflection[];
}[] {
  const plans = new Map<
    string,
    { planId: string; title: string; thumbnailUrl: string | null; reflections: Reflection[] }
  >();
  // Newest first, so each plan's place and its rows both follow the latest writing.
  for (const reflection of [...reflections].reverse()) {
    const plan = plans.get(reflection.planId) ?? {
      planId: reflection.planId,
      title: reflection.planTitle,
      thumbnailUrl: reflection.thumbnailUrl,
      reflections: [],
    };
    plan.reflections.push(reflection);
    plans.set(reflection.planId, plan);
  }
  return [...plans.values()];
}
