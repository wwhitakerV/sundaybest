import { MOCK_DATA } from "@/core/mock-data";

// Under Jest every image is the same stub; these name their file instead, so a
// test can tell which picture a sermon shows.
jest.mock("../../../assets/images/mock/sermon-today-i-choose-to-be-a-blessing.jpg", () => ({
  uri: "sermon-today-i-choose-to-be-a-blessing.jpg",
}));
jest.mock("../../../assets/images/mock/break-the-cycle-of-negative-thinking.jpg", () => ({
  uri: "break-the-cycle-of-negative-thinking.jpg",
}));
jest.mock("../../../assets/images/mock/still-praying.jpg", () => ({ uri: "still-praying.jpg" }));
jest.mock("../../../assets/images/mock/overcome-temptation.jpg", () => ({
  uri: "overcome-temptation.jpg",
}));
jest.mock("../../../assets/images/mock/the-church-must-not-partner-with-the-world.jpg", () => ({
  uri: "the-church-must-not-partner-with-the-world.jpg",
}));

const data = MOCK_DATA;
const all = <T>(table: Record<string, T>) => Object.values(table);

/** Each bundled thumbnail, the plan whose sermon shows it, and that plan's title — its file's name. */
const TITLED_AFTER_THUMBNAIL = [
  {
    planId: "plan-choose-whom-you-will-serve",
    file: "sermon-today-i-choose-to-be-a-blessing.jpg",
    title: "Today I Choose to Be a Blessing",
  },
  {
    planId: "plan-give-thanks",
    file: "break-the-cycle-of-negative-thinking.jpg",
    title: "Break the Cycle of Negative Thinking",
  },
  { planId: "plan-faith-through-the-storm", file: "still-praying.jpg", title: "Still Praying" },
  {
    planId: "plan-come-to-me-and-rest",
    file: "overcome-temptation.jpg",
    title: "Overcome Temptation",
  },
  {
    planId: "plan-salt-and-light",
    file: "the-church-must-not-partner-with-the-world.jpg",
    title: "The Church Must Not Partner with the World",
  },
];

describe("MOCK_DATA", () => {
  it("files every record under its own ID", () => {
    const tables: Record<string, { id: string }>[] = [
      data.sermons,
      data.plans,
      data.planDays,
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
      expect(question?.choices.map((choice) => choice.id)).toContain(answer.choiceId);
    }
  });

  it("answers every question in a finished attempt, and some in an unfinished one", () => {
    for (const attempt of all(data.quizAttempts)) {
      const answered = all(data.quizAnswers).filter((answer) => answer.attemptId === attempt.id);
      const questions = all(data.quizQuestions).filter(
        (question) => question.quizId === attempt.quizId,
      );

      expect(answered.length).toBeLessThanOrEqual(questions.length);
      expect(answered.length === questions.length).toBe(attempt.status === "completed");
    }
  });

  it("marks a day completed exactly when it has a completion time", () => {
    for (const day of all(data.planDays)) {
      expect(day.status === "completed").toBe(day.completedAt !== null);
    }
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

  it.each(TITLED_AFTER_THUMBNAIL)(
    "shows $file on the plan titled after it",
    ({ planId, file, title }) => {
      const plan = all(data.plans).find(({ id }) => id === planId);

      expect(plan?.title).toBe(title);
      expect(plan && data.sermons[plan.sermonId]?.thumbnailUrl).toBe(file);
    },
  );

  it("bundles a thumbnail for every plan the Plans tab lists", () => {
    const listed = all(data.plans).filter(
      (plan) => !plan.isSample && ["ready", "active", "completed"].includes(plan.status),
    );

    expect(TITLED_AFTER_THUMBNAIL.map(({ planId }) => planId)).toEqual(
      expect.arrayContaining(listed.map((plan) => plan.id)),
    );
  });

  it("is building a plan that exists, from its sermon", () => {
    const { generation } = data;

    expect(generation?.planId && data.plans[generation.planId]?.status).toBe("generating");
    expect(generation?.sermonId && data.sermons[generation.sermonId]).toBeDefined();
  });
});
