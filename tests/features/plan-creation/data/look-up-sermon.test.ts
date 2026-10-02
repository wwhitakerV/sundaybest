import { lookUpMockSermon, MOCK_TEST_LINKS } from "@/core/plan-builder";
import { lookUpSermon } from "@/features/plan-creation/data/look-up-sermon";

describe("lookUpSermon", () => {
  it("returns the same preview core's lookup gives for a link", () => {
    const url = "https://youtube.com/watch?v=abc123";
    expect(lookUpSermon(url)).toEqual(lookUpMockSermon(url));
  });

  it("returns the same preview for a link every time", () => {
    const url = "https://youtu.be/xyz";
    expect(lookUpSermon(url)).toEqual(lookUpSermon(url));
  });

  it("passes a test link through to core's lookup", () => {
    const url = MOCK_TEST_LINKS.noCaptions;
    expect(lookUpSermon(url)).toEqual(lookUpMockSermon(url));
  });
});
