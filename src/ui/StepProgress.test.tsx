import { render, screen } from "@test/render";

import { StepProgress } from "./StepProgress";

describe("StepProgress", () => {
  it("forwards testID to the outermost view", () => {
    render(<StepProgress testID="a-step-progress" steps={4} activeIndex={0} />);

    expect(screen.getByTestId("a-step-progress")).toBeVisible();
  });

  it("renders one segment per step", () => {
    render(<StepProgress testID="a-step-progress" steps={4} activeIndex={1} />);

    expect(screen.getByTestId("a-step-progress-segment-0")).toBeVisible();
    expect(screen.getByTestId("a-step-progress-segment-1")).toBeVisible();
    expect(screen.getByTestId("a-step-progress-segment-2")).toBeVisible();
    expect(screen.getByTestId("a-step-progress-segment-3")).toBeVisible();
    expect(screen.queryByTestId("a-step-progress-segment-4")).toBeNull();
  });

  it("colours a completed segment (before the active index) solid dark", () => {
    render(<StepProgress testID="a-step-progress" steps={4} activeIndex={2} />);

    expect(screen.getByTestId("a-step-progress-segment-0")).toHaveStyle({
      backgroundColor: "#08090A",
    });
  });

  it("colours the active segment with the accent colour", () => {
    render(<StepProgress testID="a-step-progress" steps={4} activeIndex={2} />);

    expect(screen.getByTestId("a-step-progress-segment-2")).toHaveStyle({
      backgroundColor: "#D62626",
    });
  });

  it("colours an upcoming segment (after the active index) light grey", () => {
    render(<StepProgress testID="a-step-progress" steps={4} activeIndex={0} />);

    expect(screen.getByTestId("a-step-progress-segment-3")).toHaveStyle({
      backgroundColor: "#F7F1F1",
    });
  });

  it("supports a 3-segment tracker for Quick Check", () => {
    render(<StepProgress testID="a-step-progress" steps={3} activeIndex={1} />);

    expect(screen.getByTestId("a-step-progress-segment-0")).toBeVisible();
    expect(screen.getByTestId("a-step-progress-segment-1")).toBeVisible();
    expect(screen.getByTestId("a-step-progress-segment-2")).toBeVisible();
    expect(screen.queryByTestId("a-step-progress-segment-3")).toBeNull();
  });
});
