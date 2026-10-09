import { HOW_PLANS_ARE_MADE } from "@/features/settings/logic/how-plans-are-made";

describe("HOW_PLANS_ARE_MADE", () => {
  it("opens on what it's about, in a line, with no label stacked over it", () => {
    expect(HOW_PLANS_ARE_MADE.statement).toBe("From Sunday's sermon to your study plan.");
    expect(HOW_PLANS_ARE_MADE).not.toHaveProperty("eyebrow");
  });

  it("walks the five steps in the order they happen", () => {
    expect(HOW_PLANS_ARE_MADE.steps.map(({ heading }) => heading)).toEqual([
      "You choose a sermon",
      "We make sure it's built on Scripture",
      "We read the whole message",
      "Your days are written",
      "Your Quick Check is built",
    ]);
  });

  it("keeps each step to a short paragraph", () => {
    for (const step of HOW_PLANS_ARE_MADE.steps) {
      expect(step.text.length).toBeGreaterThan(0);
      expect(step.text.length).toBeLessThanOrEqual(260);
    }
  });

  it("features one statement, and sets out what stays true", () => {
    expect(HOW_PLANS_ARE_MADE.quote).toMatch(/Scripture is never rewritten/);
    expect(HOW_PLANS_ARE_MADE.truths.items?.length).toBeGreaterThanOrEqual(3);
  });

  it("never names the services, models, or instructions behind it", () => {
    const words = JSON.stringify(HOW_PLANS_ARE_MADE).toLowerCase();

    for (const secret of ["openai", "gpt", "anthropic", "claude", "supadata", "prompt", "llm"]) {
      expect(words).not.toContain(secret);
    }
  });
});
