import { searchQuickChecks, toSearchable } from "@/features/progress/logic/recall";
import { aRecalledQuickCheck } from "@tests/factories/api-lists";
import { uuid } from "@tests/factories/api-plans";

const quickChecks = toSearchable([
  aRecalledQuickCheck({ quizId: uuid(1), planTitle: "Peace with God", reference: "Romans 5:1-11" }),
  aRecalledQuickCheck({ quizId: uuid(2), planTitle: "The Shepherd", reference: "Psalm 23" }),
  aRecalledQuickCheck({ quizId: uuid(3), planTitle: "Peace with God", reference: "Romans 8:1-17" }),
]);

const ids = (words: string) => searchQuickChecks(quickChecks, words).map(({ quizId }) => quizId);

describe("searchQuickChecks", () => {
  it("keeps every Quick Check with nothing typed", () => {
    expect(ids(" ")).toEqual([uuid(1), uuid(2), uuid(3)]);
  });

  it("finds Quick Checks by their plan", () => {
    expect(ids("shepherd")).toEqual([uuid(2)]);
  });

  it("finds Quick Checks by their passage", () => {
    expect(ids("romans 8")).toEqual([uuid(3)]);
  });

  it("finds Quick Checks holding every word typed, across plan and passage", () => {
    expect(ids("peace romans 5")).toEqual([uuid(1)]);
  });

  it("finds what was typed whatever its case", () => {
    expect(ids("PSALM")).toEqual([uuid(2)]);
  });

  it("finds nothing for words no Quick Check holds", () => {
    expect(ids("zebra")).toEqual([]);
  });
});
