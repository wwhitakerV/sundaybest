import { getSegmentFill } from "@/utils/steps/getSegmentFill";

describe("getSegmentFill", () => {
  it("fills the current step's segment up to the page it's on", () => {
    expect(getSegmentFill("active", 2, 0).fill).toBe(0.5);
    expect(getSegmentFill("active", 2, 1).fill).toBe(1);
  });

  it("puts a dot where each page after the first begins", () => {
    expect(getSegmentFill("active", 3, 0).dots).toEqual([1 / 3, 2 / 3]);
  });

  it("fills a finished step's segment", () => {
    expect(getSegmentFill("completed", 2, 0)).toEqual({
      fill: 1,
      dots: [0.5],
    });
  });

  it("leaves a step still ahead empty", () => {
    expect(getSegmentFill("upcoming", 2, 0)).toEqual({
      fill: 0,
      dots: [0.5],
    });
  });

  it("has no dots, and a full fill, for a step of one page", () => {
    expect(getSegmentFill("active", 1, 0)).toEqual({ fill: 1, dots: [] });
  });

  it("keeps a page outside the step's range within it", () => {
    expect(getSegmentFill("active", 2, 5).fill).toBe(1);
    expect(getSegmentFill("active", 2, -1).fill).toBe(0.5);
  });
});
