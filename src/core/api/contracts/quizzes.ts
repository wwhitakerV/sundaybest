import { z } from "zod";

import { apiIdSchema, isoDateTimeSchema } from "./common";

const quizQuestionKindSchema = z.enum(["multipleChoice", "finishTheVerse"]);
const quizQuestionSourceSchema = z.enum(["sermon", "scripture"]);

const quizChoiceSchema = z.object({
  id: apiIdSchema,
  label: z.string().min(1).max(4),
  text: z.string().min(1).max(1000),
});

/** Public question shape deliberately excludes the answer key. */
const publicQuizQuestionSchema = z.object({
  id: apiIdSchema,
  order: z.number().int().positive(),
  kind: quizQuestionKindSchema,
  source: quizQuestionSourceSchema,
  prompt: z.string().min(1).max(2000),
  choices: z.array(quizChoiceSchema).min(2).max(8),
  scriptureReference: z.string().max(100).nullable(),
});

const quizSchema = z.object({
  id: apiIdSchema,
  planId: apiIdSchema,
  planDayId: apiIdSchema.nullable(),
  title: z.string().min(1).max(200),
  questions: z.array(publicQuizQuestionSchema).min(1),
});

const quizAttemptSchema = z.object({
  id: apiIdSchema,
  quizId: apiIdSchema,
  status: z.enum(["inProgress", "completed"]),
  currentQuestionId: apiIdSchema.nullable(),
  startedAt: isoDateTimeSchema,
  completedAt: isoDateTimeSchema.nullable(),
});

const quizScoreSchema = z.object({
  correct: z.number().int().nonnegative(),
  total: z.number().int().positive(),
  percentage: z.number().int().min(0).max(100),
});

/**
 * Feedback for a submitted answer. It is intentionally separate from the
 * public question so unopened questions never carry their answer key.
 */
const quizAnswerFeedbackSchema = z.object({
  answerId: apiIdSchema,
  questionId: apiIdSchema,
  choiceId: apiIdSchema,
  correct: z.boolean(),
  correctChoiceId: apiIdSchema,
  explanation: z.string().nullable(),
  scriptureReference: z.string().max(100).nullable(),
  answeredAt: isoDateTimeSchema,
});

/**
 * The resumable Quick Check session. Existing answer feedback is returned so
 * closing/reopening a quiz can faithfully reconstruct what the user already
 * answered without shipping answer keys for untouched questions.
 */
export const quizSessionResponseSchema = z.object({
  quiz: quizSchema,
  attempt: quizAttemptSchema,
  answers: z.array(quizAnswerFeedbackSchema),
  score: quizScoreSchema.nullable(),
});

// One session shape, named for each endpoint that answers with it, as the
// server's contract names them.
/** @alias */
export const startQuizAttemptResponseSchema = quizSessionResponseSchema;
/** @alias */
export const getQuizAttemptResponseSchema = quizSessionResponseSchema;

export const submitQuizAnswerRequestSchema = z
  .object({
    questionId: apiIdSchema,
    choiceId: apiIdSchema,
  })
  .strict();

export const submitQuizAnswerResponseSchema = quizAnswerFeedbackSchema;

export const completeQuizAttemptResponseSchema = z.object({
  attempt: quizAttemptSchema,
  score: quizScoreSchema,
});

export type ApiQuiz = z.infer<typeof quizSchema>;
export type ApiQuizAnswerFeedback = z.infer<typeof quizAnswerFeedbackSchema>;
export type ApiQuizSession = z.infer<typeof quizSessionResponseSchema>;
