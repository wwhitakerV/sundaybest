import type { ApiPlanAbout } from "@/core/api/contracts";
import { describePlanAbout, takeawayCardWidth } from "@/features/plans/logic/plan-about";

const ABOUT: ApiPlanAbout = {
  overview: ["Choosing God is a daily act."],
  scripturesReferenced: [
    { reference: "Joshua 24:15", book: "Joshua", chapter: 24, verseStart: 15, verseEnd: 15 },
    { reference: "Romans 12", book: "Romans", chapter: 12, verseStart: null, verseEnd: null },
  ],
  keyTakeaways: ["Grace comes before obedience."],
};

describe("describePlanAbout", () => {
  it("is nothing for a plan generated before About this plan existed", () => {
    expect(describePlanAbout(null)).toBeNull();
  });

  it("keeps the overview and takeaways as written", () => {
    expect(describePlanAbout(ABOUT)).toMatchObject({
      overview: ["Choosing God is a daily act."],
      takeaways: ["Grace comes before obedience."],
    });
  });

  it("lists each Scripture by its reference, in the sermon's order", () => {
    expect(describePlanAbout(ABOUT)?.scriptures).toEqual(["Joshua 24:15", "Romans 12"]);
  });
});

describe("takeawayCardWidth", () => {
  it("leaves the next card peeking in when there are several", () => {
    expect(takeawayCardWidth({ viewportWidth: 375, inset: 24, peek: 36, count: 3 })).toBe(291);
  });

  it("fills the page's width when there is only one", () => {
    expect(takeawayCardWidth({ viewportWidth: 375, inset: 24, peek: 36, count: 1 })).toBe(327);
  });
});
