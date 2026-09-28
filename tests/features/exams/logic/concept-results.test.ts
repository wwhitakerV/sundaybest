import { getConceptResults } from "@/features/exams/logic/concept-results";

describe("getConceptResults: shape", () => {
  it("returns one result per concept, ordered by first appearance", () => {
    const results = getConceptResults(
      [
        { primaryConceptId: "authority", correct: true },
        { primaryConceptId: "inspiration", correct: true },
        { primaryConceptId: "authority", correct: false },
      ],
      { independent: true, minimumObservations: 3 },
    );

    expect(results.map((result) => result.conceptId)).toEqual(["authority", "inspiration"]);
  });

  it("counts correct and total observations per concept", () => {
    const results = getConceptResults(
      [
        { primaryConceptId: "authority", correct: true },
        { primaryConceptId: "authority", correct: false },
        { primaryConceptId: "authority", correct: true },
      ],
      { independent: true, minimumObservations: 3 },
    );

    expect(results).toEqual([
      { conceptId: "authority", correct: 2, total: 3, label: "needsReview" },
    ]);
  });
});

describe("getConceptResults: the evidence rule (criteria 32, 34)", () => {
  it("labels strength at exactly the minimum observations, all correct (3/3)", () => {
    const results = getConceptResults(
      [
        { primaryConceptId: "authority", correct: true },
        { primaryConceptId: "authority", correct: true },
        { primaryConceptId: "authority", correct: true },
      ],
      { independent: true, minimumObservations: 3 },
    );

    expect(results[0]?.label).toBe("strength");
  });

  it("labels needsReview at exactly the minimum observations, below 80% (2/3)", () => {
    const results = getConceptResults(
      [
        { primaryConceptId: "authority", correct: true },
        { primaryConceptId: "authority", correct: true },
        { primaryConceptId: "authority", correct: false },
      ],
      { independent: true, minimumObservations: 3 },
    );

    expect(results[0]?.label).toBe("needsReview");
  });

  it("labels strength at exactly 80% (4/5)", () => {
    const results = getConceptResults(
      [
        { primaryConceptId: "authority", correct: true },
        { primaryConceptId: "authority", correct: true },
        { primaryConceptId: "authority", correct: true },
        { primaryConceptId: "authority", correct: true },
        { primaryConceptId: "authority", correct: false },
      ],
      { independent: true, minimumObservations: 3 },
    );

    expect(results[0]?.label).toBe("strength");
  });

  it("labels notEnoughEvidence below the minimum observations, even at 100% correct (2 of 3)", () => {
    const results = getConceptResults(
      [
        { primaryConceptId: "authority", correct: true },
        { primaryConceptId: "authority", correct: true },
      ],
      { independent: true, minimumObservations: 3 },
    );

    expect(results[0]?.label).toBe("notEnoughEvidence");
  });

  it("labels notEnoughEvidence when observations aren't independent, even at 100% correct (3/3)", () => {
    const results = getConceptResults(
      [
        { primaryConceptId: "authority", correct: true },
        { primaryConceptId: "authority", correct: true },
        { primaryConceptId: "authority", correct: true },
      ],
      { independent: false, minimumObservations: 3 },
    );

    expect(results[0]?.label).toBe("notEnoughEvidence");
  });
});
