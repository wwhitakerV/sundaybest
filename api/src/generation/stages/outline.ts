import { z } from "zod";

import { AppError } from "../../http/errors.js";
import type { PlanGenerationInput } from "../../providers/plan-generation-provider.js";
import { mapAbout } from "../about.js";
import { blockNumbers, sermonBlocks } from "../blocks.js";
import { POINT_KINDS, referencedPassageSchema, sermonPointSchema, type SermonPoint } from "../journey.js";
import { generatedAboutSchema, generatedScriptureSchema } from "../schema.js";
import { containsExcerpt, hasTranscriptTiming, type TranscriptSegment } from "../transcript.js";
import { sermonWords } from "../sermon-quotes.js";
import { daysOutput, mapDays, plainly, referenceOutput, sermonSource } from "./plan-days.js";

// Structured Outputs supports only plain JSON Schema constraints; cross-field
// rules are checked in `mapOutline`.
const citation = referenceOutput.extend({ evidenceQuote: z.string().min(1).max(2000) });

export const outlineOutputSchema = z.object({
  /** The preacher's name, exactly as the transcript or the video's title gives it; null when neither does. */
  speakerName: z.string().min(1).max(120).nullable(),
  points: z.array(z.object({
    id: z.string().min(1).max(40),
    kind: z.enum(POINT_KINDS),
    statement: z.string().min(1).max(300),
    /** The transcript blocks the point is made in ("b12"), one to three side by side. */
    evidenceBlocks: z.array(z.string().min(1).max(10)).min(1).max(3),
  })).min(1).max(20),
  about: z.object({
    overview: z.array(z.string().min(1).max(3000)).min(1).max(5),
    keyTakeaways: z.array(z.string().min(1).max(500)).min(1).max(7),
    scripturesReferenced: z.array(citation).max(30),
  }),
  days: daysOutput,
});

export type OutlineOutput = z.infer<typeof outlineOutputSchema>;

const outlineDaySchema = z.object({
  dayNumber: z.number().int().min(1).max(7),
  title: z.string().min(1),
  /** The day's central idea; guides the day and quiz steps, never shown. */
  focus: z.string().min(1),
  scripture: generatedScriptureSchema,
  /** The sermon's points this day carries. */
  pointIds: z.array(z.string().min(1)).min(1),
  /** The other passages the sermon names in this day's part. */
  alsoReferenced: z.array(referencedPassageSchema),
});

/** A verified plan step, as kept for a re-run. */
export const outlineSchema = z.object({
  speakerName: z.string().min(1).nullable(),
  points: z.array(sermonPointSchema).min(1),
  about: generatedAboutSchema,
  days: z.array(outlineDaySchema).min(1).max(7),
  /** What was repaired, for the review: never shown to readers. */
  notes: z.array(z.string()).default([]),
});

export type OutlineDay = z.infer<typeof outlineDaySchema>;
export type Outline = z.infer<typeof outlineSchema>;

/**
 * What the plan step finds in a sermon whatever the plan's length — its
 * speaker, points and About this plan — kept so another length only divides
 * the points into days. The title is the sermon's own (the title step's).
 */
export const sermonInventorySchema = outlineSchema.pick({ speakerName: true, points: true, about: true });

export type SermonInventory = z.infer<typeof sermonInventorySchema>;

/**
 * The plan step: About this plan, the sermon's main points, and
 * each day's title, focus, passage, points, and the other passages the sermon
 * names in its part. Nothing the sermon gives is left out, and nothing fails
 * the plan that can be put right: the days are put right as `mapDays` does,
 * and a quote of the sermon in what it writes is kept as plain words. Each
 * repair is noted.
 * Bible text is checked by the pipeline.
 */
export function mapOutline(raw: unknown, input: PlanGenerationInput): Outline {
  const parsed = outlineOutputSchema.safeParse(raw);
  if (!parsed.success) throw new AppError("INTERNAL", "The plan step returned invalid content");
  const output = parsed.data;
  const blocks = sermonBlocks(input.transcriptSegments ?? input.transcript);
  const source = sermonSource(blocks);
  const notes: string[] = [];
  const { points, segmentOf } = mapPoints(output.points, blocks, notes);
  const speakerName = verifiedSpeaker(output.speakerName, source, input);
  const words = sermonWords(input, speakerName ?? output.speakerName);
  const days = mapDays(output.days, input, points, { blocks, source, segmentOf, words }, notes);
  const about = mapAbout(output.about, source, days.map((day) => day.scripture));
  return {
    speakerName,
    points,
    about: { ...about, overview: about.overview.map((text) => plainly(text, words, notes)), keyTakeaways: about.keyTakeaways.map((text) => plainly(text, words, notes)) },
    days,
    notes,
  };
}

/**
 * The sermon's points, each listed once, with where the sermon makes it: the
 * first block the model points at, and the second it starts when the
 * transcript has timing. A point pointing at no block of the sermon is kept
 * without one, noted.
 */
function mapPoints(raw: OutlineOutput["points"], blocks: readonly TranscriptSegment[], notes: string[]) {
  const points: SermonPoint[] = [];
  const segmentOf = new Map<string, number>();
  const timed = hasTranscriptTiming(blocks);
  for (const point of raw) {
    const id = point.id.trim();
    if (points.some((kept) => kept.id === id)) {
      notes.push(`Point ${id} was listed twice; the first is kept.`);
      continue;
    }
    const block = point.evidenceBlocks.flatMap(blockNumbers).find((number) => number >= 1 && number <= blocks.length) ?? null;
    if (block === null) notes.push(`Point ${id} points at no block of the sermon.`);
    else segmentOf.set(id, block - 1);
    const startSeconds = block !== null && timed ? Math.floor(blocks[block - 1]!.startMs / 1000) : null;
    points.push({ id, kind: point.kind, statement: point.statement.trim(), block, startSeconds });
  }
  return { points, segmentOf };
}

/** The preacher's name, only when the transcript or the video's title or channel gives it as written. */
function verifiedSpeaker(name: string | null, source: string, input: PlanGenerationInput): string | null {
  const trimmed = name?.trim();
  if (!trimmed) return null;
  const named = [source, input.sermon.title, input.sermon.church ?? ""].some((text) => containsExcerpt(text, trimmed));
  return named ? trimmed : null;
}
