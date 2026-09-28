import type { ExamBand } from "@/features/exams/types";
import { getBandLabel } from "@/features/exams/logic/get-band-label";

// The real exam's bands (exam.experience.results.bands), in their authored order.
const BANDS: ExamBand[] = [
  { minPercent: 90, label: "Mastered" },
  { minPercent: 80, label: "Strong" },
  { minPercent: 70, label: "Developing" },
  { minPercent: 0, label: "Review Recommended" },
];

describe("getBandLabel: boundaries between bands", () => {
  it.each([
    [100, "Mastered"],
    [90, "Mastered"],
    [89, "Strong"],
    [80, "Strong"],
    [79, "Developing"],
    [70, "Developing"],
    [69, "Review Recommended"],
    [0, "Review Recommended"],
  ])("labels %i%% as %s", (percentage, label) => {
    expect(getBandLabel(percentage, BANDS)).toBe(label);
  });
});

describe("getBandLabel: band order", () => {
  it("resolves the same label whatever order the bands are given in", () => {
    const shuffled = [...BANDS].reverse();

    expect(getBandLabel(85, shuffled)).toBe("Strong");
  });
});

describe("getBandLabel: no bands", () => {
  it("returns null when there are no bands to match against", () => {
    expect(getBandLabel(100, [])).toBeNull();
  });
});
