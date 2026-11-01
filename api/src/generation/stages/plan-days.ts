import { z } from "zod";

import { createBibleStore } from "../../bible/bible-store.js";
import { AppError } from "../../http/errors.js";
import type { PlanGenerationInput } from "../../providers/plan-generation-provider.js";
import { withDayPassages } from "../about.js";
import { sermonBlocks } from "../blocks.js";
import type { SermonPoint } from "../journey.js";
import {
  canonicalizeCitation,
  canonicalizeScriptureFields,
  chapterIsNamed,
  firstNamedIn,
  namedChapters,
  referenceIsNamed,
  type ScriptureCitation,
  type ScriptureRange,
} from "../scripture.js";
import { sermonWords, withoutQuotes, type SermonWords } from "../sermon-quotes.js";
import { normalizeSourceText, type TranscriptSegment } from "../transcript.js";
import type { Outline, OutlineDay, SermonInventory } from "./outline.js";

// Structured Outputs supports only plain JSON Schema constraints; cross-field
// rules are checked in `mapDays`.
const passage = z.object({
  book: z.string().min(1).max(80),
  chapter: z.number().int().min(1).max(150),
  verseStart: z.number().int().min(1).max(176),
  verseEnd: z.number().int().min(1).max(176),
  reference: z.string().min(1).max(100),
});

export const referenceOutput = z.object({
  book: z.string().min(1).max(80),
  chapter: z.number().int().min(1).max(150),
  verseStart: z.number().int().min(1).max(176).nullable(),
  verseEnd: z.number().int().min(1).max(176).nullable(),
  reference: z.string().min(1).max(100),
});

/** The plan's days, as the plan step writes them, and as the plan-days step writes them from kept points. */
export const daysOutput = z.array(z.object({
  dayNumber: z.number().int().min(1).max(7),
  title: z.string().min(1).max(300),
  focus: z.string().min(1).max(600),
  scripture: passage,
  pointIds: z.array(z.string().min(1).max(40)).min(1).max(30),
  alsoReferenced: z.array(referenceOutput).max(30),
})).min(1).max(7);

export const planDaysOutputSchema = z.object({ days: daysOutput });

export type PlanDaysOutput = z.infer<typeof planDaysOutputSchema>;

/** The sermon's blocks, its words for checking names, and where each point is made. */
export interface SermonSource {
  blocks: readonly TranscriptSegment[];
  source: string;
  segmentOf: ReadonlyMap<string, number>;
  /** For keeping the sermon unquoted in what the plan step writes. */
  words: SermonWords;
}

/** Text the plan step writes, with any quote of the sermon kept as plain words, noted. */
export function plainly(text: string, words: SermonWords, notes: string[]): string {
  const settled = withoutQuotes(text.trim(), words);
  notes.push(...settled.notes);
  return settled.text;
}

let bible: ReturnType<typeof createBibleStore> | null = null;

/**
 * Another length of a sermon whose points are kept: only its days are
 * written, and the plan keeps the sermon's title, speaker, points and About
 * this plan as they were. The days are checked and put right exactly as the
 * plan step's are.
 */
export function mapPlanDays(raw: unknown, input: PlanGenerationInput, inventory: SermonInventory): Outline {
  const parsed = planDaysOutputSchema.safeParse(raw);
  if (!parsed.success) throw new AppError("INTERNAL", "The plan-days step returned invalid content");
  const blocks = sermonBlocks(input.transcriptSegments ?? input.transcript);
  const sermon = { blocks, source: sermonSource(blocks), segmentOf: pointSegments(inventory.points), words: sermonWords(input, inventory.speakerName) };
  const notes = ["The sermon's points were kept from an earlier plan; only the days were written."];
  const days = mapDays(parsed.data.days, input, inventory.points, sermon, notes);
  return { ...inventory, about: withDayPassages(inventory.about, days.map((day) => day.scripture)), days, notes };
}

/** The sermon's words, for checking what it names. */
export function sermonSource(blocks: readonly TranscriptSegment[]): string {
  return normalizeSourceText(blocks.map((block) => block.text).join(" "));
}

/** Where each kept point is made: the block it was found in. */
function pointSegments(points: readonly SermonPoint[]): Map<string, number> {
  return new Map(points.flatMap((point) => (point.block === null ? [] : [[point.id, point.block - 1] as const])));
}

/**
 * The plan's days, checked and put right: a point listed on no day, or on
 * two, is placed on the day whose part of the sermon makes it; a chapter the
 * sermon names that no day carries goes on the day whose part names it; a
 * passage the sermon never names is left out. Each repair is noted. A day's
 * passage must still be one the sermon names, and no two days may overlap.
 */
export function mapDays(raw: PlanDaysOutput["days"], input: PlanGenerationInput, points: readonly SermonPoint[], sermon: SermonSource, notes: string[]): OutlineDay[] {
  if (raw.length !== input.lengthDays) throw new AppError("INTERNAL", `The plan step must return exactly ${input.lengthDays} days`);
  const days = raw.map((day, index): OutlineDay => {
    const scripture = canonicalizeScriptureFields(day.scripture);
    const dayNumber = index + 1;
    if (!chapterIsNamed(sermon.source, scripture)) {
      throw new AppError("INTERNAL", `Day ${dayNumber}'s passage ${scripture.reference} is not named in the transcript`);
    }
    return {
      dayNumber,
      title: plainly(day.title, sermon.words, notes),
      focus: plainly(day.focus, sermon.words, notes),
      scripture,
      pointIds: day.pointIds.map((id) => id.trim()),
      alsoReferenced: mapAlsoReferenced(day.alsoReferenced, scripture, sermon.source),
    };
  });
  days.forEach((day, index) => {
    const earlier = days.slice(0, index).find((other) => overlaps(other.scripture, day.scripture));
    if (earlier) throw new AppError("INTERNAL", `Days ${earlier.dayNumber} and ${day.dayNumber} study overlapping passages`);
  });
  placeEveryPoint(points, days, sermon.segmentOf, notes);
  placeEveryChapter(sermon.blocks.map((block) => block.text), sermon.source, days, sermon.segmentOf, notes);
  return days;
}

/** Which day covers a block of the sermon: the last whose first point comes at or before it. */
function dayCovering(days: readonly OutlineDay[], segmentOf: ReadonlyMap<string, number>, segment: number | null): OutlineDay {
  if (segment === null) return days.at(-1)!;
  let covering = days[0]!;
  for (const day of days) {
    const starts = day.pointIds.map((id) => segmentOf.get(id)).filter((at): at is number => at !== undefined);
    if (starts.length > 0 && Math.min(...starts) <= segment) covering = day;
  }
  return covering;
}

/** Every point on exactly one day: one the sermon doesn't make is dropped, one on two days kept on the first, one on none placed. */
function placeEveryPoint(points: readonly SermonPoint[], days: OutlineDay[], segmentOf: ReadonlyMap<string, number>, notes: string[]): void {
  const placed = new Set<string>();
  for (const day of days) {
    day.pointIds = day.pointIds.filter((id) => {
      if (!points.some((point) => point.id === id)) {
        notes.push(`Day ${day.dayNumber} listed ${id}, which isn't one of the sermon's points; it was dropped.`);
        return false;
      }
      if (placed.has(id)) {
        notes.push(`${id} was on two days; it stays on the first.`);
        return false;
      }
      placed.add(id);
      return true;
    });
  }
  for (const point of points.filter((one) => !placed.has(one.id))) {
    const day = dayCovering(days, segmentOf, segmentOf.get(point.id) ?? null);
    day.pointIds.push(point.id);
    notes.push(`${point.id} was on no day; it was placed on day ${day.dayNumber}, where the sermon makes it.`);
  }
}

/** Every chapter the sermon names (and the Bible has) on some day: one no day carries goes on the day whose part names it. */
function placeEveryChapter(blocks: readonly string[], source: string, days: OutlineDay[], segmentOf: ReadonlyMap<string, number>, notes: string[]): void {
  bible ??= createBibleStore();
  const store = bible;
  const carried = new Set(days.flatMap((day) => [day.scripture, ...day.alsoReferenced].map(chapterName)));
  for (const chapter of namedChapters(source).filter((name) => store.chapterExists(name) && !carried.has(name))) {
    const [book, number] = [chapter.replace(/ \d+$/, ""), Number(/\d+$/.exec(chapter)![0])];
    const citation = canonicalizeCitation({ book, chapter: number, verseStart: null, verseEnd: null, reference: chapter });
    const day = dayCovering(days, segmentOf, firstNamedIn(blocks, chapter));
    day.alsoReferenced.push(citation);
    notes.push(`${chapter} was on no day; it was added to day ${day.dayNumber}, where the sermon names it.`);
  }
}

/**
 * The other passages the sermon names in a day's part, none repeating the
 * day's own passage. One the sermon never names is left out — never added —
 * as is one that isn't a passage of the Bible.
 */
function mapAlsoReferenced(raw: readonly ScriptureCitation[], scripture: ScriptureRange, source: string): ScriptureCitation[] {
  const kept = new Map<string, ScriptureCitation>();
  for (const passage of raw) {
    let canonical: ScriptureCitation;
    try {
      canonical = canonicalizeCitation(passage);
    } catch {
      continue;
    }
    if (!referenceIsNamed(source, canonical)) continue;
    if (canonical.book === scripture.book && canonical.chapter === scripture.chapter && canonical.verseStart !== null
      && canonical.verseStart >= scripture.verseStart && (canonical.verseEnd ?? canonical.verseStart) <= scripture.verseEnd) continue;
    kept.set(canonical.reference, canonical);
  }
  return [...kept.values()];
}

/** "Psalm 23", as `namedChapters` names it. */
function chapterName(passage: { book: string; chapter: number }): string {
  return `${passage.book === "Psalms" ? "Psalm" : passage.book} ${passage.chapter}`;
}

function overlaps(a: ScriptureRange, b: ScriptureRange): boolean {
  return a.book === b.book && a.chapter === b.chapter && a.verseStart <= b.verseEnd && b.verseStart <= a.verseEnd;
}
