import { z } from "zod";

import { apiIdSchema, isoDateTimeSchema } from "./common.js";

export const quizQuestionKindSchema = z.enum(["multipleChoice", "finishTheVerse"]);
export const quizQuestionSourceSchema = z.enum(["sermon", "scripture"]);

export const quizChoiceSchema = z.object({
  id: apiIdSchema,
  label: z.string().min(1).max(4),
  text: z.string().min(1).max(1000),
});

/** Public question shape deliberately excludes the answer key. */
export const publicQuizQuestionSchema = z.object({
  id: apiIdSchema,
  order: z.number().int().positive(),
  kind: quizQuestionKindSchema,
  source: quizQuestionSourceSchema,
  prompt: z.string().min(1).max(2000),
  choices: z.array(quizChoiceSchema).min(2).max(8),
  scriptureReference: z.string().max(100).nullable(),
});

export const quizSchema = z.object({
  id: apiIdSchema,
  planId: apiIdSchema,
  planDayId: apiIdSchema.nullable(),
  title: z.string().min(1).max(200),
  questions: z.array(publicQuizQuestionSchema).min(1),
});

export const quizAttemptSchema = z.object({
  id: apiIdSchema,
  quizId: apiIdSchema,
  status: z.enum(["inProgress", "completed"]),
  currentQuestionId: apiIdSchema.nullable(),
  startedAt: isoDateTimeSchema,
  completedAt: isoDateTimeSchema.nullable(),
});

export const startQuizAttemptResponseSchema = z.object({
  quiz: quizSchema,
  attempt: quizAttemptSchema,
});

export const getQuizAttemptResponseSchema = startQuizAttemptResponseSchema;

export const submitQuizAnswerRequestSchema = z
  .object({
    questionId: apiIdSchema,
    choiceId: apiIdSchema,
  })
  .strict();

export const submitQuizAnswerResponseSchema = z.object({
  answerId: apiIdSchema,
  questionId: apiIdSchema,
  choiceId: apiIdSchema,
  correct: z.boolean(),
  correctChoiceId: apiIdSchema,
  explanation: z.string().nullable(),
  scriptureReference: z.string().max(100).nullable(),
  answeredAt: isoDateTimeSchema,
});

export const completeQuizAttemptResponseSchema = z.object({
  attempt: quizAttemptSchema,
  score: z.object({
    correct: z.number().int().nonnegative(),
    total: z.number().int().positive(),
    percentage: z.number().int().min(0).max(100),
  }),
});

export type ApiQuiz = z.infer<typeof quizSchema>;
export type ApiQuizAttempt = z.infer<typeof quizAttemptSchema>;
