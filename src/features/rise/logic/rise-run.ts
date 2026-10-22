import { z } from "zod";

import { RISE, type RiseQuestion } from "@/entities/rise";

/** A tenth of a second: the grain times are kept and shown in. */
const TENTH = 100;

/**
 * A day's run of RISE as it's kept on the phone (`game_results.detail`):
 * every question by its id, its answers in the order they were shown, which
 * was right, which was crossed out (-1: neither) and how far into its rise
 * that mark was last made — enough to score it again, to replay it, and to
 * rank it. Read back, it's parsed, never trusted.
 */
const runSchema = z.object({
  version: z.literal(1),
  questions: z.array(
    z.object({
      id: z.string(),
      answers: z.tuple([z.string(), z.string()]),
      right: z.union([z.literal(0), z.literal(1)]),
      marked: z.number().int().min(-1).max(1),
      markedAt: z.number().nonnegative(),
    }),
  ),
});

export type RiseRun = z.infer<typeof runSchema>;
type RunQuestion = RiseRun["questions"][number];

/** How a question went: the wrong one crossed out, the right one, or neither. */
export type RiseVerdict = "right" | "wrong" | "missed";

/** A day's run, from its questions and the marks the board ended with. */
export function makeRiseRun(
  questions: readonly RiseQuestion[],
  marks: readonly { marked: number; markedAt: number }[],
): RiseRun {
  return {
    version: 1,
    questions: questions.map((question, index) => ({
      id: question.id,
      answers: question.answers,
      right: question.right,
      marked: marks.at(index)?.marked ?? -1,
      // Kept to the tenth of a second it's shown in, so the times shown always add up.
      markedAt: Math.round((marks.at(index)?.markedAt ?? RISE.riseMs) / TENTH) * TENTH,
    })),
  };
}

/** A kept run, read back — or null, when there's none or it isn't understood. */
export function readRiseRun(detail: string | null | undefined): RiseRun | null {
  if (!detail) return null;
  try {
    const parsed = runSchema.safeParse(JSON.parse(detail));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/** How one question went. */
export function verdictOf(question: RunQuestion): RiseVerdict {
  if (question.marked === -1) return "missed";
  return question.marked === question.right ? "wrong" : "right";
}

/** The score: right answers — the wrong one crossed out. */
export function scoreOf(run: RiseRun): number {
  return run.questions.filter((question) => verdictOf(question) === "right").length;
}

/**
 * Time to spare, the tiebreaker: for each right answer, what was left of its
 * pair's rise when its final mark went down — changing one's mind costs —
 * all told. One that burst banks nothing. More is better, as the score is.
 * Measured in the game's own time, step by step, so a slower phone isn't
 * penalised; kept to the tenth, so the times shown always add up.
 */
export function spareMs(run: RiseRun): number {
  return run.questions.reduce(
    (total, question) =>
      total + (verdictOf(question) === "right" ? RISE.riseMs - question.markedAt : 0),
    0,
  );
}
