import { MOCK_DATA, SAMPLE_PLAN_ID } from "@/core/mock-data";

// Under Jest every image is the same stub; these name their file instead, so a
// test can tell which picture a sermon shows.
jest.mock("../../../assets/images/mock/today-i-choose-to-be-a-blessing.jpg", () => ({
  uri: "today-i-choose-to-be-a-blessing.jpg",
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

// Node's own `fs`, read for real: the test lists the image folder itself. Jest
// runs from the repository root, so the path is relative to it.
const { readdirSync } = jest.requireActual<{ readdirSync: (path: string) => string[] }>("fs");
const MOCK_IMAGES_DIR = "assets/images/mock";

/**
 * The mock images, and the title each one's sermon and plan carry — its file
 * name. Every sermon and plan in the mocks is one of these; nothing else.
 */
const MOCK_IMAGES = [
  { slug: "today-i-choose-to-be-a-blessing", title: "Today I Choose to Be a Blessing" },
  { slug: "break-the-cycle-of-negative-thinking", title: "Break the Cycle of Negative Thinking" },
  { slug: "still-praying", title: "Still Praying" },
  { slug: "overcome-temptation", title: "Overcome Temptation" },
  {
    slug: "the-church-must-not-partner-with-the-world",
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

  it("has an image in the mock folder for each entry, and no other", () => {
    const files = readdirSync(MOCK_IMAGES_DIR).filter((file) => file.endsWith(".jpg"));

    expect(files.sort()).toEqual(MOCK_IMAGES.map(({ slug }) => `${slug}.jpg`).sort());
  });

  it("has one sermon per image, named, titled, and pictured after its file", () => {
    expect(
      all(data.sermons)
        .map(({ id, title, thumbnailUrl }) => ({ id, title, thumbnailUrl }))
        .sort((a, b) => a.id.localeCompare(b.id)),
    ).toEqual(
      MOCK_IMAGES.map(({ slug, title }) => ({
        id: `sermon-${slug}`,
        title,
        thumbnailUrl: `${slug}.jpg`,
      })).sort((a, b) => a.id.localeCompare(b.id)),
    );
  });

  it("has one plan per image, named and titled after its file, built from its sermon", () => {
    expect(
      all(data.plans)
        .map(({ id, title, sermonId }) => ({ id, title, sermonId }))
        .sort((a, b) => a.id.localeCompare(b.id)),
    ).toEqual(
      MOCK_IMAGES.map(({ slug, title }) => ({
        id: `plan-${slug}`,
        title,
        sermonId: `sermon-${slug}`,
      })).sort((a, b) => a.id.localeCompare(b.id)),
    );
  });

  it("gives every sermon three colours from its thumbnail, as hex", () => {
    for (const sermon of all(data.sermons)) {
      expect(sermon.thumbnailColors).toEqual([
        expect.stringMatching(/^#[0-9A-F]{6}$/),
        expect.stringMatching(/^#[0-9A-F]{6}$/),
        expect.stringMatching(/^#[0-9A-F]{6}$/),
      ]);
    }
  });

  it("names a church for every sermon", () => {
    for (const sermon of all(data.sermons)) expect(sermon.church).toEqual(expect.any(String));
  });

  it("makes The Church Must Not Partner with the World the one sample plan", () => {
    expect(
      all(data.plans)
        .filter((plan) => plan.isSample)
        .map((plan) => plan.id),
    ).toEqual(["plan-the-church-must-not-partner-with-the-world"]);
    expect(SAMPLE_PLAN_ID).toBe("plan-the-church-must-not-partner-with-the-world");
  });

  it("starts with no plan being built", () => {
    expect(data.generation).toBeNull();
  });
});
