import {
  NEW_PLAN_STEPS,
  getNewPlanLeadingAction,
  getNextNewPlanAction,
} from "@/features/plan-creation/logic/new-plan-steps";

describe("new plan steps", () => {
  it("runs Paste Sermon, then Link Preview", () => {
    expect(NEW_PLAN_STEPS.map((step) => step.key)).toEqual(["paste-sermon", "link-preview"]);
  });

  it("exits the flow from the first step's leading button", () => {
    expect(getNewPlanLeadingAction(0)).toEqual({ type: "exit" });
  });

  it("steps back from the second step's leading button", () => {
    expect(getNewPlanLeadingAction(1)).toEqual({ type: "step", step: 0 });
  });

  it("advances from the first step", () => {
    expect(getNextNewPlanAction(0)).toEqual({ type: "step", step: 1 });
  });

  it("creates the plan from the last step", () => {
    expect(getNextNewPlanAction(1)).toEqual({ type: "create" });
  });
});
