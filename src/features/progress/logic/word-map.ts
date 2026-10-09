import type { ApiWordPassage } from "@/core/api/contracts";
import { BIBLE_BOOKS, OLD_TESTAMENT_BOOKS } from "./bible-books";

/** The longest book, by chapters: Psalms, at the map's full height. */
const MOST_CHAPTERS = 150;
/** The shortest line's share of the tallest, so a one-chapter book still shows beside Psalms. */
const LEAST_SHARE = 0.14;

/** A book's line on the map: its height as a share of the tallest, and whether it's been studied. */
export type MapLine = { book: string; share: number; studied: boolean; newTestament: boolean };

/** A book studied, and how many of its passages. */
export type StudiedBook = { book: string; count: number };

/** What the page says with its chart: how to read it. */
export const WORD_WITH_CHART =
  "Each line is a book of the Bible. The dark ones are where you've been. The chart is interactive. You can tap, drag, and zoom.";
/** What it says with the chart put away: what the list below is. */
export const WORD_WITHOUT_CHART = "Every passage you've finished, book by book.";

/** What the page says before the first passage is finished. */
export const WORD_EMPTY = "Your first passage will appear here.";

/**
 * The Bible as 66 lines, Genesis to Revelation: each as tall as its book is
 * long — by the square root of its chapters, so the short ones stay visible —
 * dark where the reader has finished a passage.
 */
export function describeMapLines(studied: ReadonlySet<string>): MapLine[] {
  return BIBLE_BOOKS.map((book, index) => ({
    book: book.name,
    share: LEAST_SHARE + (1 - LEAST_SHARE) * Math.sqrt(book.chapters / MOST_CHAPTERS),
    studied: studied.has(book.name),
    newTestament: index >= OLD_TESTAMENT_BOOKS,
  }));
}

/** The books studied, in Bible order, each with how many passages. */
export function getStudiedBooks(passages: readonly ApiWordPassage[]): StudiedBook[] {
  return BIBLE_BOOKS.flatMap(({ name }) => {
    const count = passages.filter((passage) => passage.book === name).length;
    return count > 0 ? [{ book: name, count }] : [];
  });
}

/** A book's passages, in chapter and verse order. */
export function getBookPassages(
  passages: readonly ApiWordPassage[],
  book: string,
): ApiWordPassage[] {
  return passages
    .filter((passage) => passage.book === book)
    .sort((a, b) => a.chapter - b.chapter || a.verseStart - b.verseStart);
}

/** The book studied most recently: the one the page opens on. */
export function getLatestBook(passages: readonly ApiWordPassage[]): string | null {
  const latest = [...passages].sort((a, b) => b.completedAt.localeCompare(a.completedAt))[0];
  return latest?.book ?? null;
}

/** The studied book nearest a line on the map — where a tap there lands — or null with none studied. */
export function getNearestStudied(lines: readonly MapLine[], index: number): string | null {
  const studied = lines.flatMap((line, at) =>
    line.studied ? [{ book: line.book, distance: Math.abs(at - index) }] : [],
  );
  return studied.sort((a, b) => a.distance - b.distance)[0]?.book ?? null;
}
