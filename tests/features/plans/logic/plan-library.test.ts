import { describeIssue } from "@/features/plans/logic/plan-library";
import { aPlan } from "@tests/factories/api-plans";

const about = {
  overview: ["A plan about waiting on God."],
  keyTakeaways: ["God is faithful in the waiting.", "Trust Him today."],
  scripturesReferenced: [],
};

describe("describeIssue", () => {
  it("is the plan's first takeaway, never a quote of the sermon", () => {
    expect(describeIssue(aPlan({ about })).standfirst).toEqual({
      lead: "Takeaway",
      now: false,
      text: "God is faithful in the waiting.",
      quoted: false,
    });
  });

  it("has no line for a plan without takeaways", () => {
    expect(describeIssue(aPlan()).standfirst).toBeNull();
  });
});
