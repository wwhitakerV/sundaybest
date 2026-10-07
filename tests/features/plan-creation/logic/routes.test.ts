import { GENERATION_SHEET_HREF } from "@/features/plan-creation/logic/routes";

describe("plan-creation routes", () => {
  it("opens the generation sheet at a route the app has", () => {
    expect(GENERATION_SHEET_HREF).toBe("/generation");
    expect(jest.requireActual<{ default: unknown }>("@/app/generation").default).toBeDefined();
  });
});
