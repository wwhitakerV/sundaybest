import { z } from "zod";

import { AppError } from "../../http/errors.js";
import type { PlanGenerationInput } from "../../providers/plan-generation-provider.js";
import { framingProblem } from "../framing.js";
import { FACULTIES, endingPointSchema, facultyEntrySchema, type EndingPoint, type FacultyEntry } from "../journey.js";
import { namedChapters } from "../scripture.js";
import { quoteProblem, sermonWords, withoutQuotes } from "../sermon-quotes.js";
import type { Outline, OutlineDay } from "./outline.js";

// Structured Outputs supports only plain JSON Schema constraints; the rest is
// checked, and where it can be, put right, in `mapFormation`.
/** One day's six faculties, as the model writes them. */
export const formationOutputSchema = z.object({
  faculties: z.array(z.object({
    faculty: z.enum(FACULTIES),
    pointId: z.string().min(1).max(40),
    transition: z.string().min(1).max(120).nullable(),
    question: z.string().min(1).max(200),
    answer: z.string().min(1).max(600),
    reflection: z.string().min(1).max(120).nullable(),
    commitment: z.string().min(1).max(160),
  })).min(FACULTIES.length).max(FACULTIES.length),
});

export type FormationOutput = z.infer<typeof formationOutputSchema>;

/** A verified day of faculties, as kept for a re-run. */
export const formationContentSchema = z.object({
  faculties: z.array(facultyEntrySchema).length(FACULTIES.length),
  ending: z.array(endingPointSchema),
  /** What was repaired or let stand, for the review: never shown to readers. */
  notes: z.array(z.string()).default([]),
});

export type FormationContent = z.infer<typeof formationContentSchema>;

/** Everything the model writes for a faculty. */
const WRITTEN = ["transition", "question", "answer", "reflection", "commitment"] as const;

/**
 * One day's faculties: its six, put in their order, each a question answered
 * from what the sermon teaches at one of the day's points, in the plan's
 * voice; and the day's points no faculty answers, listed at its end by their
 * own statements. An answer naming another point counts as the day's.
 * Writing that names Scripture the sermon doesn't, or quotes the sermon, is
 * written again, and on the last attempt kept — its quotes as plain words —
 * noted. A day without all six faculties is written again.
 */
export function mapFormation(raw: unknown, input: PlanGenerationInput, outline: Outline, day: OutlineDay, attempt = { last: false }): FormationContent {
  const parsed = formationOutputSchema.safeParse(raw);
  if (!parsed.success) throw new AppError("INTERNAL", `The faculties for day ${day.dayNumber} came back in the wrong shape`);
  const output = parsed.data;
  const present = new Set(output.faculties.map((entry) => entry.faculty));
  if (present.size !== FACULTIES.length) {
    throw new AppError("INTERNAL", `Day ${day.dayNumber} needs each of ${FACULTIES.join(", ")} once`);
  }
  const notes: string[] = [];
  const transcript = input.transcriptSegments ?? input.transcript;
  const sermonChapters = namedChapters(typeof transcript === "string" ? transcript : transcript.map((segment) => segment.text).join(" "));

  const sermon = sermonWords(input, outline.speakerName);

  const settle = (text: string, label: string): string => {
    const problem = framingProblem(text, sermonChapters) ?? quoteProblem(text, sermon);
    if (problem) {
      if (!attempt.last) throw new AppError("INTERNAL", `Day ${day.dayNumber}'s ${label} ${problem}`);
      notes.push(`Day ${day.dayNumber}'s ${label} ${problem}; kept after every attempt did, without quotes of the sermon.`);
    }
    return withoutQuotes(text.trim(), sermon).text;
  };

  const ordered = [...output.faculties].sort((a, b) => FACULTIES.indexOf(a.faculty) - FACULTIES.indexOf(b.faculty));
  const faculties = ordered.map((entry): FacultyEntry => {
    const pointId = day.pointIds.includes(entry.pointId.trim()) ? entry.pointId.trim() : (day.pointIds[0] ?? entry.pointId.trim());
    const written = (field: (typeof WRITTEN)[number]) => {
      const text = entry[field];
      return text === null ? null : settle(text, `${entry.faculty} ${field}`);
    };
    return {
      faculty: entry.faculty,
      pointId,
      transition: written("transition"),
      question: written("question")!,
      answer: written("answer")!,
      reflection: written("reflection"),
      commitment: written("commitment")!,
    };
  });

  const answered = new Set(faculties.map((entry) => entry.pointId));
  const ending: EndingPoint[] = outline.points
    .filter((point) => day.pointIds.includes(point.id) && !answered.has(point.id))
    .map((point) => ({ pointId: point.id, statement: point.statement }));
  return { faculties, ending, notes };
}
