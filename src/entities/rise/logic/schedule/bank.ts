import { z } from "zod";

/**
 * RISE's question bank and schedule, as their files hold them. The bank is
 * edited in `scripts/rise/questions.json`; `npm run build:rise` checks it,
 * extends the schedule, and copies both into `src/entities/rise/data`.
 */

/** How hard a question is: the editors' rating, to be recalibrated from how players do. */
const difficultySchema = z.enum(["easy", "medium", "hard"]);

const bankQuestionSchema = z.object({
  id: z.string().regex(/^rise-\d{3,}$/),
  /** Any domain: a new one needs no other change. */
  category: z.string().min(1),
  difficulty: difficultySchema,
  question: z.string().min(1),
  options: z.tuple([z.string().min(1), z.string().min(1)]),
  correctIndex: z.union([z.literal(0), z.literal(1)]),
  /** What it teaches: one line, shown once the day's played. */
  fact: z.string().min(1),
  /** Questions that would give this one away, or it them: never asked the same day. */
  conflicts: z.array(z.string()).optional(),
});

export const bankSchema = z.array(bankQuestionSchema);

export type BankQuestion = z.infer<typeof bankQuestionSchema>;
export type Difficulty = z.infer<typeof difficultySchema>;

/** A day's six, by id, each with the side its right answer is shown on. */
const scheduledDaySchema = z.object({
  /** Which pass through the bank this day belongs to: no question twice in one. */
  cycle: z.number().int().positive(),
  questions: z.array(z.object({ id: z.string(), correctOnLeft: z.boolean() })),
});

/** Every day's questions, day 1 first. Only ever added to: a day published never changes. */
export const scheduleSchema = z.object({ days: z.array(scheduledDaySchema) });

export type Schedule = z.infer<typeof scheduleSchema>;
