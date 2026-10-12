import { apiQueryKeys, isInReaderTranslation } from "@/core/api/query-keys";

describe("isInReaderTranslation", () => {
  it.each([
    ["a study day's Scripture", apiQueryKeys.studyDay("plan-1", 2)],
    ["Progress's week, its key verses", apiQueryKeys.week("2026-10-04")],
    ["The Word's passages", apiQueryKeys.word],
  ])("is true for %s", (_, key) => {
    expect(isInReaderTranslation(key)).toBe(true);
  });

  it.each([
    ["the plans list", apiQueryKeys.plans],
    ["a plan", apiQueryKeys.plan("plan-1")],
    ["the settings themselves", apiQueryKeys.settings],
    ["the reader", apiQueryKeys.me],
    ["every week a plan ran in", apiQueryKeys.weeks],
    ["the reflections", apiQueryKeys.reflections],
    ["a Quick Check", apiQueryKeys.quizSession("quiz-1")],
  ])("is false for %s", (_, key) => {
    expect(isInReaderTranslation(key)).toBe(false);
  });

  it("never matches a whole root by its prefix alone (Progress's root holds data in no translation)", () => {
    expect(isInReaderTranslation(apiQueryKeys.progressRoot)).toBe(false);
  });
});
