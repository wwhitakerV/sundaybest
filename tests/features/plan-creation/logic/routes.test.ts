import { planReadyHref, preparingHref } from "@/features/plan-creation/logic/routes";

describe("plan-creation routes", () => {
  it("builds the Preparing route with the plan ID", () => {
    expect(preparingHref("plan-a")).toEqual({
      pathname: "/(plan-creation)/preparing",
      params: { planId: "plan-a" },
    });
  });

  it("builds the Plan Ready route with the plan ID", () => {
    expect(planReadyHref("plan-a")).toEqual({
      pathname: "/(plan-creation)/ready",
      params: { planId: "plan-a" },
    });
  });
});
