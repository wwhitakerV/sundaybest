import { NEW_PLAN_STEPS } from "@/features/plan-creation/logic/new-plan-steps";

// Which way each step goes is newPlanReducer's (new-plan-flow.test.ts).
describe("new plan steps", () => {
  it("runs Paste Sermon, then Link Preview", () => {
    expect(NEW_PLAN_STEPS.map((step) => step.key)).toEqual(["paste-sermon", "link-preview"]);
  });
});
