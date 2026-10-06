import { existsSync } from "node:fs";

import { GENERATION_SHEET_HREF } from "@/features/plan-creation/logic/routes";

describe("plan-creation routes", () => {
  it("opens the generation sheet at a route the app has", () => {
    expect(GENERATION_SHEET_HREF).toBe("/generation");
    expect(existsSync("src/app/generation.tsx")).toBe(true);
  });
});
