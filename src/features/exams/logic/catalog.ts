const WORDS = [
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
  "Eleven",
  "Twelve",
] as const;

function plural(count: number, noun: string): string {
  return `${noun}${count === 1 ? "" : "s"}`;
}

function twoDigits(value: number): string {
  return String(value).padStart(2, "0");
}

/** The exams page's count: "12 subjects · 48 exams". */
export function formatCatalogCount(subjects: readonly { exams: readonly unknown[] }[]): string {
  const exams = subjects.reduce((total, subject) => total + subject.exams.length, 0);
  return `${subjects.length} ${plural(subjects.length, "subject")} · ${exams} ${plural(exams, "exam")}`;
}

/** A subject's number, from its index: "01". */
export function formatSubjectNumber(index: number): string {
  return twoDigits(index + 1);
}

/** A subject's place among them, from its index: "01 / 12". */
export function formatSubjectPosition(index: number, total: number): string {
  return `${formatSubjectNumber(index)} / ${twoDigits(total)}`;
}

/** A level, as a word: "Foundations". */
export function formatLevelName(level: string): string {
  return `${level.charAt(0).toUpperCase()}${level.slice(1)}`;
}

/** How many exams a subject holds, spelled out: "Four exams" — in figures past twelve. */
export function formatExamCountInWords(count: number): string {
  return `${WORDS.at(count) ?? count} ${plural(count, "exam")}`;
}

/** The page a paged carousel has come to rest on, from how far it's scrolled — within the pages there are. */
export function getCarouselIndex(offset: number, interval: number, count: number): number {
  if (interval <= 0 || count <= 0) return 0;
  return Math.min(count - 1, Math.max(0, Math.round(offset / interval)));
}

/** A folio's share of the carousel's width — the next one peeking in beside it. */
const FOLIO_SHARE = 0.74;
/** Between one folio and the next. */
const FOLIO_GAP = 10;
/** The first folio's distance in from the carousel's left edge. */
const FOLIO_INSET = 36;

/**
 * How a carousel of folios lays out across a width: each folio's width, the
 * gap between, the inset before the first and the room after the last (so
 * it can come to rest in the same place), and the distance from one resting
 * place to the next.
 */
export function getFolioGeometry(carouselWidth: number) {
  const width = Math.round(carouselWidth * FOLIO_SHARE);
  return {
    width,
    gap: FOLIO_GAP,
    inset: FOLIO_INSET,
    trailing: Math.max(0, carouselWidth - FOLIO_INSET - width),
    interval: width > 0 ? width + FOLIO_GAP : 0,
  };
}

/** A book this tall fits its heading and four exams of two lines each, as designed. */
const REGULAR_FOLIO_HEIGHT = 470;

/**
 * How a subject's book sets itself for the height it's given: `regular`,
 * as designed; `compact`, on a shorter screen — a smaller title, and one
 * line an exam — so it still fits without the page scrolling.
 */
export function getFolioTier(height: number): "regular" | "compact" {
  return height >= REGULAR_FOLIO_HEIGHT ? "regular" : "compact";
}
