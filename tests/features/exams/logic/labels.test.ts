import {
  formatDuration,
  formatModeLabel,
  formatQuestionCount,
  getInstruction,
} from "@/features/exams/logic/labels";

describe("getInstruction", () => {
  it("instructs single choice to choose one", () => {
    expect(getInstruction("single_choice")).toBe("Choose one");
  });

  it("instructs true/false to choose true or false", () => {
    expect(getInstruction("true_false")).toBe("True or false");
  });

  it("instructs multiple select to select all that apply", () => {
    expect(getInstruction("multiple_select")).toBe("Select all that apply");
  });

  it("never states a count for multiple select (criterion 10)", () => {
    expect(getInstruction("multiple_select")).not.toMatch(/\d/);
  });

  it("instructs matching to match each one", () => {
    expect(getInstruction("matching")).toBe("Match each one");
  });

  it("instructs ordering to put the steps in order", () => {
    expect(getInstruction("ordering")).toBe("Put these in order");
  });
});

describe("formatDuration", () => {
  it("shows a range with an en dash when the minutes differ", () => {
    expect(formatDuration([8, 12])).toBe("8–12 min");
  });

  it("collapses to a single value when the minutes are equal", () => {
    expect(formatDuration([10, 10])).toBe("10 min");
  });
});

describe("formatQuestionCount", () => {
  it("pluralizes questions for more than one", () => {
    expect(formatQuestionCount(15)).toBe("15 questions");
  });

  it("keeps question singular for exactly one", () => {
    expect(formatQuestionCount(1)).toBe("1 question");
  });
});

describe("formatModeLabel", () => {
  it("names Exam Mode", () => {
    expect(formatModeLabel("exam", false)).toBe("Exam Mode");
  });

  it("names Study Mode", () => {
    expect(formatModeLabel("study", false)).toBe("Study Mode");
  });

  it("marks a Practice attempt after its mode", () => {
    expect(formatModeLabel("exam", true)).toBe("Exam Mode · Practice");
  });
});
