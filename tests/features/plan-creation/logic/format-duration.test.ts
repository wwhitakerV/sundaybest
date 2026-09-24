import { formatDuration } from "@/features/plan-creation/logic/format-duration";

describe("formatDuration", () => {
  it("shows minutes and seconds", () => {
    expect(formatDuration(2_538)).toBe("42:18");
  });

  it("pads seconds under ten", () => {
    expect(formatDuration(65)).toBe("1:05");
  });

  it("adds hours past an hour", () => {
    expect(formatDuration(3_725)).toBe("1:02:05");
  });
});
