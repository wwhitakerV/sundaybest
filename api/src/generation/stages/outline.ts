import { z } from "zod";

import { AppError } from "../../http/errors.js";
import type { PlanGenerationInput } from "../../providers/plan-generation-provider.js";
import { mapAbout } from "../about.js";
import { generatedAboutSchema, generatedScriptureSchema } from "../schema.js";
import { canonicalizeScriptureFields, chapterIsNamed, type ScriptureRange } from "../scripture.js";
import { normalizeSourceText } from "../transcript.js";

// Structured Outputs supports only plain JSON Schema constraints; cross-field
// rules are checked in `mapOutline`.
const passage = z.object({
  book: z.string().min(1).max(80),
  chapter: z.number().int().min(1).max(150),
  verseStart: z.number().int().min(1).max(176),
  verseEnd: z.number().int().min(1).max(176),
  reference: z.string().min(1).max(100),
});

const citation = z.object({
  book: z.string().min(1).max(80),
  chapter: z.number().int().min(1).max(150),
  verseStart: z.number().int().min(1).max(176).nullable(),
  verseEnd: z.number().int().min(1).max(176).nullable(),
  reference: z.string().min(1).max(100),
  evidenceQuote: z.string().min(1).max(2000),
});

export const outlineOutputSchema = z.object({
  title: z.string().min(1).max(300),
  about: z.object({
    overview: z.array(z.string().min(1).max(3000)).min(1).max(5),
    keyTakeaways: z.array(z.string().min(1).max(500)).min(1).max(7),
    scripturesReferenced: z.array(citation).max(30),
  }),
  days: z.array(z.object({
    dayNumber: z.number().int().min(1).max(7),
    title: z.string().min(1).max(300),
    focus: z.string().min(1).max(600),
    scripture: passage,
  })).min(1).max(7),
});

export type OutlineOutput = z.infer<typeof outlineOutputSchema>;

const outlineDaySchema = z.object({
  dayNumber: z.number().int().min(1).max(7),
  title: z.string().min(1),
  /** The day's central idea; guides the day and quiz steps, never shown. */
  focus: z.string().min(1),
  scripture: generatedScriptureSchema,
});

/** A verified plan step, as kept for a re-run. */
export const outlineSchema = z.object({ title: z.string().min(1), about: generatedAboutSchema, days: z.array(outlineDaySchema).min(1).max(7) });

export type OutlineDay = z.infer<typeof outlineDaySchema>;
export type Outline = z.infer<typeof outlineSchema>;

/**
 * The plan step: the title, About this plan, and each day's title, focus and
 * passage. Every passage must be in a chapter the sermon names, and no two days
 * may overlap. Bible text is checked by the pipeline.
 */
export function mapOutline(raw: unknown, input: PlanGenerationInput): Outline {
  const parsed = outlineOutputSchema.safeParse(raw);
  if (!parsed.success) throw new AppError("INTERNAL", "The plan step returned invalid content");
  const { days: rawDays } = parsed.data;
  if (rawDays.length !== input.lengthDays) throw new AppError("INTERNAL", `The plan step must return exactly ${input.lengthDays} days`);
  const source = normalizeSourceText(input.transcriptSegments?.map((s) => s.text).join(" ") ?? input.transcript);
  const days = rawDays.map((day, index): OutlineDay => {
    const scripture = canonicalizeScriptureFields(day.scripture);
    const dayNumber = index + 1;
    if (!chapterIsNamed(source, scripture)) {
      throw new AppError("INTERNAL", `Day ${dayNumber}'s passage ${scripture.reference} is not named in the transcript`);
    }
    return { dayNumber, title: day.title.trim(), focus: day.focus.trim(), scripture };
  });
  days.forEach((day, index) => {
    const earlier = days.slice(0, index).find((other) => overlaps(other.scripture, day.scripture));
    if (earlier) throw new AppError("INTERNAL", `Days ${earlier.dayNumber} and ${day.dayNumber} study overlapping passages`);
  });
  return {
    title: parsed.data.title.trim(),
    about: mapAbout(parsed.data.about, source, days.map((day) => day.scripture)),
    days,
  };
}

function overlaps(a: ScriptureRange, b: ScriptureRange): boolean {
  return a.book === b.book && a.chapter === b.chapter && a.verseStart <= b.verseEnd && b.verseStart <= a.verseEnd;
}
