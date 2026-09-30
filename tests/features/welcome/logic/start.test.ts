import { getStartRoutes } from "@/features/welcome/logic/start";

describe("getStartRoutes", () => {
  it("goes Home, and straight on to paste a sermon, for someone with no plans", () => {
    expect(getStartRoutes(false)).toEqual(["/(tabs)/home", "/(plan-creation)/paste-sermon"]);
  });

  it("goes Home alone for someone who has plans", () => {
    expect(getStartRoutes(true)).toEqual(["/(tabs)/home"]);
  });
});
