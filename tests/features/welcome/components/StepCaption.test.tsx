import { render, screen } from "@tests/helpers/render";

import { StepCaption } from "@/features/welcome/components/StepCaption";

// The caption bursts in, and Jest's Reanimated mock freezes animated styles
// at their first (transparent) frame — so these assert what's rendered.
describe("StepCaption", () => {
  it("shows nothing before any step has been on stage", () => {
    render(<StepCaption testID="a-caption" caption={{ mode: "hidden" }} />);

    expect(screen.queryByTestId("a-caption")).toBeNull();
  });

  it("shows the step on stage", () => {
    render(<StepCaption caption={{ mode: "step", step: 1, word: null }} />);

    expect(screen.getByText("Get a plan for 1 to 7 days")).toBeOnTheScreen();
  });

  it("picks out the item of step 3 on stage and dims the rest", () => {
    render(<StepCaption caption={{ mode: "step", step: 2, word: 1 }} />);

    expect(screen.getByText(", reflect")).toHaveStyle({ color: "#08090A" });
    expect(screen.getByText("Read")).toHaveStyle({ color: "#8A8A92" });
  });

  it("keeps the last step while it fades out between turns", () => {
    const view = render(<StepCaption caption={{ mode: "step", step: 0, word: null }} />);

    view.rerender(<StepCaption caption={{ mode: "hidden" }} />);

    expect(screen.getByText("Paste any sermon link")).toBeOnTheScreen();
  });
});
