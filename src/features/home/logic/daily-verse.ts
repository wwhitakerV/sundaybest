import { pickKeyVerse } from "@/entities/scripture";

/** The translations the app carries the words of (`npm run build:verses`). */
export type VerseTranslation = "BSB" | "KJV";

/** One day's verse, as `data/daily-verses.json` holds it. */
export type DailyVerseDay = {
  date: string;
  /** SundayBest's line for the day. */
  caption: string;
  /** "James 5:7-8". */
  reference: string;
  verses: Record<VerseTranslation, readonly { number: number; text: string }[]>;
};

const MS_PER_DAY = 86_400_000;

const dayNumber = (date: string) => Date.parse(`${date}T00:00:00.000Z`) / MS_PER_DAY;

/**
 * Today's verse: the list's own for today, or — once the list has run out, or
 * before it starts — the one as many days round the list again.
 */
export function pickDailyVerse(
  days: readonly DailyVerseDay[],
  today: string,
): DailyVerseDay | null {
  const first = days[0];
  if (!first) return null;
  const offset = Math.round(dayNumber(today) - dayNumber(first.date));
  return days[((offset % days.length) + days.length) % days.length] ?? null;
}

/** The translation a reader's verse is shown in: theirs when the app carries it, else the BSB. */
export function verseTranslationFor(setting: string | null | undefined): VerseTranslation {
  return setting === "KJV" ? "KJV" : "BSB";
}

/**
 * What the card shows: the verse (a long passage's key verse, whole), its
 * reference with the translation it's in, the bare reference (to name the card
 * aloud), the day's line, and the day it's for.
 */
export function describeDailyVerse(day: DailyVerseDay, translation: VerseTranslation) {
  return {
    day: describeVerseDate(day.date),
    verse: pickKeyVerse(day.verses[translation]) ?? "",
    reference: `${day.reference} · ${translation}`,
    passage: day.reference,
    caption: day.caption,
  };
}

/** The day a verse is for, in full: `2026-10-19` → "Monday, October 19". Read in UTC, as it's stored. */
export function describeVerseDate(date: string): string {
  return new Date(`${date}T00:00:00.000Z`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

/** What's shared as words: the whole passage, quoted, then where it's from. */
export function describeVerseShare(day: DailyVerseDay, translation: VerseTranslation): string {
  const passage = day.verses[translation].map(({ text }) => text).join(" ");
  return `“${passage}”\n${day.reference} (${translation})`;
}
