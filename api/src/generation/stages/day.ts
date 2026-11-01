import { z } from "zod";

import { AppError } from "../../http/errors.js";
import type { PlanGenerationInput } from "../../providers/plan-generation-provider.js";
import { quoteProblem, sermonWords, withoutQuotes } from "../sermon-quotes.js";
import type { Outline, OutlineDay } from "./outline.js";

/** One Read paragraph: a short editorial heading, the teaching under it, and the sermon's points it covers. */
const readingParagraphOutput = z.object({
  heading: z.string().min(1).max(80),
  content: z.string().min(1).max(8000),
  pointIds: z.array(z.string().min(1).max(40)).max(30),
});

export const dayOutputSchema = z.object({
  readingParagraphs: z.array(readingParagraphOutput).min(1).max(20),
  reflections: z.array(z.string().min(1).max(1000)).min(1).max(2),
  prayer: z.object({ title: z.string().min(1).max(200), text: z.string().min(1).max(5000) }),
});

export type DayOutput = z.infer<typeof dayOutputSchema>;

/** A verified day step, as kept for a re-run. */
export const dayContentSchema = z.object({
  readingParagraphs: z
    .array(z.object({ heading: z.string().min(1), content: z.string().min(1) }))
    .min(1)
    .max(20),
  reflections: z.array(z.string().min(1)).min(1).max(2),
  prayer: z.object({ title: z.string().min(1), text: z.string().min(1) }),
  /** Which of the sermon's points each Read section covers, section by section. */
  readingPointIds: z.array(z.array(z.string().min(1))),
  /** What was repaired or let stand, for the review: never shown to readers. */
  notes: z.array(z.string()).default([]),
});

export type DayContent = z.infer<typeof dayContentSchema>;

/**
 * The day step: one day's reading, reflections, and prayer — no Scripture of
 * its own: every passage comes from the sermon, and no quotes of it: its clip
 * is worked out from its points (`dayClips`). Writing that quotes the sermon
 * is written again, and on the last attempt kept as plain words, noted. The
 * Read should cover every point the day carries: one that doesn't is written
 * again, and on the step's last attempt kept, with a note.
 */
export function mapDay(raw: unknown, input: PlanGenerationInput, day: OutlineDay, outline: Outline, attempt = { last: false }): DayContent {
  const parsed = dayOutputSchema.safeParse(raw);
  if (!parsed.success) throw new AppError("INTERNAL", `The day step returned invalid content for day ${day.dayNumber}`);
  const output = parsed.data;
  const notes: string[] = [];
  const known = new Set(outline.points.map((point) => point.id));
  // A section's points are only ever the sermon's: any other id is dropped.
  const readingPointIds = output.readingParagraphs.map((paragraph) => paragraph.pointIds.map((id) => id.trim()).filter((id) => known.has(id)));
  const covered = new Set(readingPointIds.flat());
  const missing = day.pointIds.filter((id) => !covered.has(id));
  if (missing.length > 0) {
    const message = `Day ${day.dayNumber}'s Read leaves out ${missing.join(", ")}; it must cover every point of its day`;
    if (!attempt.last) throw new AppError("INTERNAL", message);
    notes.push(`${message}. Kept after every attempt missed it.`);
  }
  const sermon = sermonWords(input, outline.speakerName);
  const settle = (text: string, label: string) => {
    const problem = quoteProblem(text, sermon);
    if (problem) {
      if (!attempt.last) throw new AppError("INTERNAL", `Day ${day.dayNumber}'s ${label} ${problem}`);
      notes.push(`Day ${day.dayNumber}'s ${label} ${problem}; kept as plain words after every attempt did.`);
    }
    return withoutQuotes(text.trim(), sermon).text;
  };
  return {
    readingParagraphs: output.readingParagraphs.map(({ heading, content }) => ({
      heading: settle(heading, "Read"),
      content: settle(content, "Read"),
    })),
    readingPointIds,
    reflections: output.reflections.map((reflection) => settle(reflection, "reflection")),
    prayer: { title: output.prayer.title.trim(), text: settle(output.prayer.text, "prayer") },
    notes,
  };
}
