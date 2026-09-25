import { lookUpMockSermon } from "@/core/plan-builder";
import { buildMockPlanContent } from "@/core/plan-builder/build-plan-content";
import type { Plan } from "@/types/domain";

const AT = "2026-09-23T12:00:00.000Z";
const plan = (lengthDays: Plan["lengthDays"], quickCheckEnabled: boolean): Plan => ({
  id: "plan-new",
  createdAt: AT,
  updatedAt: AT,
  userId: "user",
  sermonId: "sermon-new",
  title: "",
  status: "generating",
  lengthDays,
  quickCheckEnabled,
  startDate: null,
  startedAt: null,
  completedAt: null,
  archivedAt: null,
  isSample: false,
});
const sermon = lookUpMockSermon("https://youtube.com/watch?v=Qm81xRz4");
const build = (lengthDays: Plan["lengthDays"], quickCheckEnabled = true) =>
  buildMockPlanContent({
    plan: plan(lengthDays, quickCheckEnabled),
    sermon,
    translation: "NIV",
    at: AT,
  });

describe("buildMockPlanContent", () => {
  it("writes one day per day of the plan, numbered from 1", () => {
    expect(build(6).days.map((day) => day.dayNumber)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(build(1).days).toHaveLength(1);
  });

  it("opens the first day and locks the rest", () => {
    expect(build(3).days.map((day) => day.status)).toEqual(["available", "locked", "locked"]);
  });

  it("gives every day its Scripture, a reflection, and a prayer", () => {
    const content = build(4);

    for (const day of content.days) {
      expect(content.scripture.map((passage) => passage.id)).toContain(day.scriptureId);
      expect(content.reflections.some((reflection) => reflection.planDayId === day.id)).toBe(true);
      expect(content.prayers.some((prayer) => prayer.planDayId === day.id)).toBe(true);
    }
  });

  it("uses the reader's Bible translation", () => {
    expect(build(2).scripture.every((passage) => passage.translation === "NIV")).toBe(true);
  });

  it("makes a Quick Check per day only when the plan has one", () => {
    expect(build(3).quizzes).toHaveLength(3);
    expect(build(3, false).quizzes).toHaveLength(0);
    expect(build(3, false).quizQuestions).toHaveLength(0);
  });

  it("gives every question a right answer among its choices, not always in the same place", () => {
    const { quizQuestions } = build(7);
    const rightLabels = quizQuestions.map(
      (question) =>
        question.choices.find((choice) => choice.id === question.correctChoiceId)?.label,
    );

    expect(rightLabels.every(Boolean)).toBe(true);
    expect(new Set(rightLabels).size).toBeGreaterThan(1);
  });

  it("titles the plan after its sermon", () => {
    expect(build(2).title).toBe("Today I Choose to Be a Blessing");
  });

  it("builds the same plan every time", () => {
    expect(build(5)).toEqual(build(5));
  });
});

describe("lookUpMockSermon", () => {
  it("finds a mock sermon by its link", () => {
    expect(sermon).toMatchObject({
      title: "Today I Choose to Be a Blessing",
      church: "VOUS Church",
    });
  });

  it("finds the same sermon for the same unknown link, every time", () => {
    const link = "https://youtube.com/watch?v=zz99yy";

    expect(lookUpMockSermon(link)).toEqual(lookUpMockSermon(link));
  });

  it("finds no captions for the no-captions test link", () => {
    expect(lookUpMockSermon("https://youtube.com/watch?v=nocaptions").transcriptStatus).toBe(
      "unavailable",
    );
  });
});
