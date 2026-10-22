import { chooseSides, sidesProblems } from "@/entities/rise/logic/schedule/answer-sides";

const SEEDS = Array.from({ length: 200 }, (_, index) => index * 7919 + 1);

describe("chooseSides", () => {
  it("puts the right answer on the left three times in six, and on the right three", () => {
    for (const seed of SEEDS) {
      expect(chooseSides(seed).filter(Boolean)).toHaveLength(3);
    }
  });

  it("never puts it on one side three times running, nor strictly alternates", () => {
    for (const seed of SEEDS) expect(sidesProblems(chooseSides(seed))).toEqual([]);
  });

  it("gives the same sides for the same seed, and varies them between seeds", () => {
    expect(chooseSides(42)).toEqual(chooseSides(42));
    const patterns = new Set(SEEDS.map((seed) => chooseSides(seed).join()));
    expect(patterns.size).toBeGreaterThan(5);
  });
});

describe("sidesProblems", () => {
  it("names each way a day's sides are predictable", () => {
    expect(sidesProblems([true, true, true, false, false, false])).toContain(
      "the right answer is on one side three times running",
    );
    expect(sidesProblems([true, false, true, false, true, false])).toContain(
      "the right answer alternates sides",
    );
    expect(sidesProblems([true, true, false, true, false, true])).toContain(
      "the right answer is on the left 4 times",
    );
  });
});
