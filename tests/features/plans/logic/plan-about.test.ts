import type { ApiPlanAbout } from "@/core/api/contracts";
import { describePlanAbout } from "@/features/plans/logic/plan-about";

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
