import { and, asc, desc, eq } from "drizzle-orm";

import type { Database } from "../db/client.js";
import {
  planDays,
  planStepProgress,
  quizAnswers,
  quizAttempts,
  quizChoices,
  quizQuestions,
  quizzes,
} from "../db/schema.js";
import { AppError } from "../http/errors.js";
import { requireStudyAccess } from "./study-access.js";

export function createQuizService(db: Database) {
  async function loadQuiz(quizId: string) {
    const quizRows = await db.select().from(quizzes).where(eq(quizzes.id, quizId)).limit(1);
    const quiz = quizRows[0];
    if (!quiz) throw new AppError("NOT_FOUND", "Quick Check not found");
    const questions = await db
      .select()
      .from(quizQuestions)
      .where(eq(quizQuestions.quizId, quiz.id))
      .orderBy(asc(quizQuestions.position));
    const publicQuestions = [];
    for (const question of questions) {
      const choices = await db
        .select({ id: quizChoices.id, label: quizChoices.label, text: quizChoices.text })
        .from(quizChoices)
        .where(eq(quizChoices.questionId, question.id))
        .orderBy(asc(quizChoices.position));
      publicQuestions.push({
        id: question.id,
        order: question.position,
        kind: question.kind,
        source: question.source,
        prompt: question.prompt,
        choices,
        scriptureReference: question.scriptureReference,
      });
    }
    return {
      id: quiz.id,
      planId: quiz.planId,
      planDayId: quiz.planDayId,
      title: quiz.title,
      questions: publicQuestions,
    };
  }

  async function toAttempt(attempt: typeof quizAttempts.$inferSelect) {
    const questions = await db
      .select({ id: quizQuestions.id, position: quizQuestions.position })
      .from(quizQuestions)
      .where(eq(quizQuestions.quizId, attempt.quizId))
      .orderBy(asc(quizQuestions.position));
    const answers = await db
      .select({ questionId: quizAnswers.questionId })
      .from(quizAnswers)
      .where(eq(quizAnswers.attemptId, attempt.id));
    const answered = new Set(answers.map((row) => row.questionId));
    const currentQuestionId =
      attempt.status === "completed"
        ? null
        : questions.find((question) => !answered.has(question.id))?.id ?? null;
    return {
      id: attempt.id,
      quizId: attempt.quizId,
      status: attempt.status,
      currentQuestionId,
      startedAt: attempt.startedAt.toISOString(),
      completedAt: attempt.completedAt?.toISOString() ?? null,
    } as const;
  }

  async function requireAttempt(userId: string, attemptId: string) {
    const rows = await db
      .select()
      .from(quizAttempts)
      .where(and(eq(quizAttempts.id, attemptId), eq(quizAttempts.userId, userId)))
      .limit(1);
    if (!rows[0]) throw new AppError("NOT_FOUND", "Quick Check attempt not found");
    return rows[0];
  }

  async function latestAttempt(userId: string, quizId: string) {
    const attempts = await db
      .select()
      .from(quizAttempts)
      .where(and(eq(quizAttempts.userId, userId), eq(quizAttempts.quizId, quizId)))
      .orderBy(desc(quizAttempts.startedAt))
      .limit(1);
    return attempts[0] ?? null;
  }

  async function answerFeedback(attemptId: string) {
    const rows = await db
      .select({
        answerId: quizAnswers.id,
        questionId: quizAnswers.questionId,
        choiceId: quizAnswers.choiceId,
        correct: quizAnswers.correct,
        correctChoiceId: quizChoices.id,
        answeredAt: quizAnswers.answeredAt,
        explanation: quizQuestions.explanation,
        scriptureReference: quizQuestions.scriptureReference,
      })
      .from(quizAnswers)
      .innerJoin(quizQuestions, eq(quizQuestions.id, quizAnswers.questionId))
      .innerJoin(
        quizChoices,
        and(
          eq(quizChoices.questionId, quizQuestions.id),
          eq(quizChoices.isCorrect, true),
        ),
      )
      .where(eq(quizAnswers.attemptId, attemptId))
      .orderBy(asc(quizQuestions.position));

    return rows.map((row) => ({
      answerId: row.answerId,
      questionId: row.questionId,
      choiceId: row.choiceId,
      correct: row.correct,
      correctChoiceId: row.correctChoiceId,
      explanation: row.explanation,
      scriptureReference: row.scriptureReference,
      answeredAt: row.answeredAt.toISOString(),
    }));
  }

  async function scoreForAttempt(attempt: typeof quizAttempts.$inferSelect) {
    if (attempt.status !== "completed") return null;
    const [questions, answers] = await Promise.all([
      db
        .select({ id: quizQuestions.id })
        .from(quizQuestions)
        .where(eq(quizQuestions.quizId, attempt.quizId)),
      db
        .select({ correct: quizAnswers.correct })
        .from(quizAnswers)
        .where(eq(quizAnswers.attemptId, attempt.id)),
    ]);
    if (questions.length === 0) return null;
    const correct = answers.filter((answer) => answer.correct).length;
    return {
      correct,
      total: questions.length,
      percentage: Math.round((correct / questions.length) * 100),
    };
  }

  async function toSession(attempt: typeof quizAttempts.$inferSelect) {
    const [quiz, publicAttempt, answers, score] = await Promise.all([
      loadQuiz(attempt.quizId),
      toAttempt(attempt),
      answerFeedback(attempt.id),
      scoreForAttempt(attempt),
    ]);
    return { quiz, attempt: publicAttempt, answers, score };
  }

  return {
    async startAttempt(userId: string, quizId: string, timezone: string) {
      const quizRows = await db.select().from(quizzes).where(eq(quizzes.id, quizId)).limit(1);
      const quiz = quizRows[0];
      if (!quiz) throw new AppError("NOT_FOUND", "Quick Check not found");
      if (quiz.planDayId) {
        const dayRows = await db.select().from(planDays).where(eq(planDays.id, quiz.planDayId)).limit(1);
        const day = dayRows[0];
        if (!day) throw new AppError("INTERNAL", "Quick Check day is missing");
        const access = await requireStudyAccess({
          db,
          userId,
          planId: quiz.planId,
          dayNumber: day.dayNumber,
          timezone,
        });
        const prayed = await db
          .select({ step: planStepProgress.step })
          .from(planStepProgress)
          .where(
            and(
              eq(planStepProgress.enrollmentId, access.enrollment.id),
              eq(planStepProgress.planDayId, access.day.id),
              eq(planStepProgress.step, "pray"),
            ),
          )
          .limit(1);
        if (!prayed[0]) throw new AppError("STUDY_INCOMPLETE", "Complete Pray before Quick Check");
      }

      let attempt = await latestAttempt(userId, quizId);
      if (!attempt) {
        const [created] = await db.insert(quizAttempts).values({ userId, quizId }).returning();
        if (!created) throw new AppError("INTERNAL");
        attempt = created;
      }
      return toSession(attempt);
    },

    async getCurrentAttempt(userId: string, quizId: string) {
      const attempt = await latestAttempt(userId, quizId);
      if (!attempt) throw new AppError("NOT_FOUND", "Quick Check has not been started");
      return toSession(attempt);
    },

    async getAttempt(userId: string, attemptId: string) {
      const attempt = await requireAttempt(userId, attemptId);
      return toSession(attempt);
    },

    async submitAnswer(
      userId: string,
      attemptId: string,
      input: { questionId: string; choiceId: string },
    ) {
      const attempt = await requireAttempt(userId, attemptId);
      if (attempt.status !== "inProgress")
        throw new AppError("CONFLICT", "Quick Check attempt is already complete");
      const orderedQuestions = await db
        .select()
        .from(quizQuestions)
        .where(eq(quizQuestions.quizId, attempt.quizId))
        .orderBy(asc(quizQuestions.position));
      const answeredRows = await db
        .select({ questionId: quizAnswers.questionId })
        .from(quizAnswers)
        .where(eq(quizAnswers.attemptId, attempt.id));
      const answeredIds = new Set(answeredRows.map((row) => row.questionId));
      const expectedQuestion = orderedQuestions.find((question) => !answeredIds.has(question.id));
      if (!expectedQuestion) throw new AppError("CONFLICT", "Every Quick Check question is already answered");
      if (expectedQuestion.id !== input.questionId) {
        throw new AppError("STUDY_INCOMPLETE", "Answer Quick Check questions in order");
      }
      const question = expectedQuestion;
      const choices = await db
        .select()
        .from(quizChoices)
        .where(eq(quizChoices.questionId, question.id))
        .orderBy(asc(quizChoices.position));
      const selected = choices.find((choice) => choice.id === input.choiceId);
      const correct = choices.find((choice) => choice.isCorrect);
      if (!selected || !correct)
        throw new AppError("VALIDATION_FAILED", "Choice does not belong to this question");

      const existing = await db
        .select({ id: quizAnswers.id })
        .from(quizAnswers)
        .where(and(eq(quizAnswers.attemptId, attempt.id), eq(quizAnswers.questionId, question.id)))
        .limit(1);
      if (existing[0]) throw new AppError("ANSWER_ALREADY_SUBMITTED", "This answer was already submitted");

      const [answer] = await db
        .insert(quizAnswers)
        .values({
          attemptId: attempt.id,
          questionId: question.id,
          choiceId: selected.id,
          correct: selected.isCorrect,
        })
        .returning();
      if (!answer) throw new AppError("INTERNAL");
      return {
        answerId: answer.id,
        questionId: question.id,
        choiceId: selected.id,
        correct: selected.isCorrect,
        correctChoiceId: correct.id,
        explanation: question.explanation,
        scriptureReference: question.scriptureReference,
        answeredAt: answer.answeredAt.toISOString(),
      };
    },

    async completeAttempt(userId: string, attemptId: string) {
      const attempt = await requireAttempt(userId, attemptId);
      const questions = await db
        .select({ id: quizQuestions.id })
        .from(quizQuestions)
        .where(eq(quizQuestions.quizId, attempt.quizId));
      const answers = await db
        .select({ correct: quizAnswers.correct })
        .from(quizAnswers)
        .where(eq(quizAnswers.attemptId, attempt.id));
      if (questions.length === 0 || answers.length !== questions.length) {
        throw new AppError("STUDY_INCOMPLETE", "Answer every Quick Check question first");
      }
      let completed = attempt;
      if (attempt.status !== "completed") {
        const [updated] = await db
          .update(quizAttempts)
          .set({ status: "completed", completedAt: new Date() })
          .where(eq(quizAttempts.id, attempt.id))
          .returning();
        if (!updated) throw new AppError("INTERNAL");
        completed = updated;
      }
      const correct = answers.filter((answer) => answer.correct).length;
      return {
        attempt: await toAttempt(completed),
        score: {
          correct,
          total: questions.length,
          percentage: Math.round((correct / questions.length) * 100),
        },
      };
    },
  };
}
