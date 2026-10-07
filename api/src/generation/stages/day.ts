import { z } from "zod";

import { AppError } from "../../http/errors.js";
import type { PlanGenerationInput } from "../../providers/plan-generation-provider.js";
import { clipIsValid } from "../clip.js";
import { generatedSupportingScriptureSchema } from "../schema.js";
import { mapSupporting } from "../supporting.js";
import { containsExcerpt, normalizeSourceText } from "../transcript.js";
import type { Outline, OutlineDay } from "./outline.js";

/** One Read paragraph: a short editorial heading and the teaching under it. */
const readingParagraphOutput = z.object({
  heading: z.string().min(1).max(80),
  content: z.string().min(1).max(8000),
});

export const dayOutputSchema = z.object({
  readingParagraphs: z.array(readingParagraphOutput).min(1).max(20),
  sermonQuote: z.string().min(1).max(2000).nullable(),
  clipStartSeconds: z.number().int().nonnegative().nullable(),
  clipEndSeconds: z.number().int().nonnegative().nullable(),
  reflections: z.array(z.string().min(1).max(1000)).min(1).max(2),
  prayer: z.object({ title: z.string().min(1).max(200), text: z.string().min(1).max(5000) }),
  supportingScriptures: z.array(z.object({
    book: z.string().min(1).max(80),
    chapter: z.number().int().min(1).max(150),
    verseStart: z.number().int().min(1).max(176),
    verseEnd: z.number().int().min(1).max(176),
    reference: z.string().min(1).max(100),
    connection: z.string().min(1).max(600),
  })).max(3),
});

export type DayOutput = z.infer<typeof dayOutputSchema>;

/** A verified day step, as kept for a re-run. */
export const dayContentSchema = z.object({
  readingParagraphs: z
    .array(z.object({ heading: z.string().min(1), content: z.string().min(1) }))
    .min(1)
    .max(20),
  sermonQuote: z.string().min(1).nullable(),
  clipStartSeconds: z.number().int().nonnegative().nullable(),
  clipEndSeconds: z.number().int().nonnegative().nullable(),
  reflections: z.array(z.string().min(1)).min(1).max(2),
  prayer: z.object({ title: z.string().min(1), text: z.string().min(1) }),
  supportingScriptures: z.array(generatedSupportingScriptureSchema).max(3),
});

export type DayContent = z.infer<typeof dayContentSchema>;

/**
 * The day step: one day's reading, quote and clip, reflections, prayer, and
 * supporting Scripture. Optional content that cannot be verified — a quote not
 * in the transcript, a clip outside it, supporting Scripture overlapping what
 * the sermon names — is left out rather than failing the day.
 */
export function mapDay(raw: unknown, input: PlanGenerationInput, day: OutlineDay, outline: Outline): DayContent {
  const parsed = dayOutputSchema.safeParse(raw);
  if (!parsed.success) throw new AppError("INTERNAL", `The day step returned invalid content for day ${day.dayNumber}`);
  const output = parsed.data;
  const source = normalizeSourceText(input.transcriptSegments?.map((s) => s.text).join(" ") ?? input.transcript);
  const sermonQuote = output.sermonQuote !== null && containsExcerpt(source, output.sermonQuote) ? output.sermonQuote.trim() : null;
  const clipKept = output.clipStartSeconds !== null && output.clipEndSeconds !== null
    && clipIsValid(output.clipStartSeconds, output.clipEndSeconds, sermonQuote, input);
  const sermonNamed = [...outline.about.scripturesReferenced, ...outline.days.map((other) => other.scripture)];
  return {
    readingParagraphs: output.readingParagraphs.map(({ heading, content }) => ({
      heading: heading.trim(),
      content: content.trim(),
    })),
    sermonQuote,
    clipStartSeconds: clipKept ? output.clipStartSeconds : null,
    clipEndSeconds: clipKept ? output.clipEndSeconds : null,
    reflections: output.reflections.map((reflection) => reflection.trim()),
    prayer: { title: output.prayer.title.trim(), text: output.prayer.text.trim() },
    supportingScriptures: mapSupporting(output.supportingScriptures, sermonNamed),
  };
}
