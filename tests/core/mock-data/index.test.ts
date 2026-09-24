import { MOCK_DATA } from "@/core/mock-data";

const data = MOCK_DATA;
const all = <T>(table: Record<string, T>) => Object.values(table);

describe("MOCK_DATA", () => {
  it("files every record under its own ID", () => {
    const tables: Record<string, { id: string }>[] = [
      data.sermons,
      data.plans,
      data.planDays,
      data.planProgress,
      data.scripture,
      data.reflections,
      data.prayers,
      data.quizzes,
      data.quizQuestions,
      data.quizAttempts,
      data.quizAnswers,
      data.reminders,
      data.library,
    ];

    for (const table of tables) {
      for (const [key, record] of Object.entries(table)) expect(record.id).toBe(key);
    }
  });

  it("points every plan at its user and a sermon that exists", () => {
    for (const plan of all(data.plans)) {
      expect(plan.userId).toBe(data.user.id);
      expect(data.sermons[plan.sermonId]).toBeDefined();
    }
  });

  it("gives every plan with days exactly its length in days, numbered in order", () => {
    for (const plan of all(data.plans)) {
      const days = all(data.planDays).filter((day) => day.planId === plan.id);
      if (days.length === 0) continue;

      expect(days.map((day) => day.dayNumber).sort((a, b) => a - b)).toEqual(
        Array.from({ length: plan.lengthDays }, (_, index) => index + 1),
      );
    }
  });

  it("builds days only for plans past drafting and generating", () => {
    for (const day of all(data.planDays)) {
      expect(["draft", "generating"]).not.toContain(data.plans[day.planId]?.status);
    }
  });

  it("links each day's Scripture, reflections, and prayer to it", () => {
    for (const day of all(data.planDays)) {
      expect(data.scripture[day.scriptureId]).toBeDefined();
      expect(all(data.reflections).some((reflection) => reflection.planDayId === day.id)).toBe(
        true,
      );
      expect(all(data.prayers).some((prayer) => prayer.planDayId === day.id)).toBe(true);
    }
  });

  it("links quizzes, questions, attempts, and answers to things that exist", () => {
    for (const quiz of all(data.quizzes)) {
      expect(data.plans[quiz.planId]?.quickCheckEnabled).toBe(true);
    }
    const dayIds = all(data.quizzes).flatMap((quiz) => (quiz.planDayId ? [quiz.planDayId] : []));
    expect(Object.keys(data.planDays)).toEqual(expect.arrayContaining(dayIds));
    for (const question of all(data.quizQuestions)) {
      expect(data.quizzes[question.quizId]).toBeDefined();
      expect(question.choices.map((choice) => choice.id)).toContain(question.correctChoiceId);
    }
    for (const answer of all(data.quizAnswers)) {
      const question = data.quizQuestions[answer.questionId];
      expect(data.quizAttempts[answer.attemptId]).toBeDefined();
      expect(answer.isCorrect).toBe(answer.choiceId === question?.correctChoiceId);
    }
  });

  it("scores each finished attempt from its answers", () => {
    for (const attempt of all(data.quizAttempts)) {
      if (attempt.status !== "completed") continue;
      const answers = all(data.quizAnswers).filter((answer) => answer.attemptId === attempt.id);

      expect(attempt.score).toEqual({
        correct: answers.filter((answer) => answer.isCorrect).length,
        total: answers.length,
      });
    }
  });

  it("marks a plan's finished days as it tracks them", () => {
    for (const progress of all(data.planProgress)) {
      const completed = all(data.planDays)
        .filter((day) => day.planId === progress.planId && day.status === "completed")
        .map((day) => day.dayNumber)
        .sort((a, b) => a - b);

      expect(progress.completedDayNumbers).toEqual(completed);
    }
  });

  it("counts every finished day in the user's history, on the day it was finished", () => {
    const finishedOn = all(data.planDays)
      .flatMap((day) => (day.completedAt ? [day.completedAt.slice(0, 10)] : []))
      .sort();

    expect(data.progress.studiedOn).toEqual(finishedOn);
    expect(data.progress.completedDayCount).toBe(finishedOn.length);
  });

  it("saves only things that exist", () => {
    const tableFor = {
      plan: data.plans,
      sermon: data.sermons,
      scripture: data.scripture,
      reflection: data.reflections,
      prayer: data.prayers,
    } as const;

    for (const item of all(data.library)) {
      expect(tableFor[item.kind][item.itemId]).toBeDefined();
    }
  });

  it("is building a plan that exists, from its sermon", () => {
    const { generation } = data;

    expect(generation?.planId && data.plans[generation.planId]?.status).toBe("generating");
    expect(generation?.sermonId && data.sermons[generation.sermonId]).toBeDefined();
  });
});
