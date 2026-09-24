import { render, screen } from "@tests/helpers/render";

import { StepProgress } from "@/ui/StepProgress";

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

  describe("a step with several pages", () => {
    // Four steps; the third has two pages, and the user is on its first.
    const PAGES = [1, 1, 2, 1];

    it("fills that step's segment in accent up to the page it's on", () => {
      render(
        <StepProgress
          testID="a-step-progress"
          steps={4}
          activeIndex={2}
          pages={PAGES}
          activePage={0}
        />,
      );

      expect(screen.getByTestId("a-step-progress-segment-2")).toHaveStyle({
        backgroundColor: "#F7F1F1",
      });
      expect(screen.getByTestId("a-step-progress-segment-2-fill")).toHaveStyle({
        width: "50%",
        backgroundColor: "#D62626",
      });
    });

    it("fills it all on the last page", () => {
      render(
        <StepProgress
          testID="a-step-progress"
          steps={4}
          activeIndex={2}
          pages={PAGES}
          activePage={1}
        />,
      );

      expect(screen.getByTestId("a-step-progress-segment-2-fill")).toHaveStyle({ width: "100%" });
    });

    it("dots the segment where each later page begins", () => {
      render(
        <StepProgress
          testID="a-step-progress"
          steps={4}
          activeIndex={2}
          pages={PAGES}
          activePage={0}
        />,
      );

      expect(screen.getByTestId("a-step-progress-segment-2-dot-1")).toHaveStyle({ left: "50%" });
      expect(screen.queryByTestId("a-step-progress-segment-2-dot-2")).toBeNull();
    });

    it("draws each dot the line's height: an accent ring, white in the middle", () => {
      render(
        <StepProgress
          testID="a-step-progress"
          steps={4}
          activeIndex={2}
          pages={[1, 1, 3, 1]}
          activePage={0}
        />,
      );

      for (const dot of ["a-step-progress-segment-2-dot-1", "a-step-progress-segment-2-dot-2"]) {
        expect(screen.getByTestId(dot)).toHaveStyle({
          width: 3,
          height: 3,
          borderColor: "#D62626",
          backgroundColor: "#FFFFFF",
        });
      }
    });

    it("rings its dots in dark once the step is done", () => {
      render(
        <StepProgress
          testID="a-step-progress"
          steps={4}
          activeIndex={3}
          pages={PAGES}
          activePage={0}
        />,
      );

      expect(screen.getByTestId("a-step-progress-segment-2")).toHaveStyle({
        backgroundColor: "#08090A",
      });
      expect(screen.getByTestId("a-step-progress-segment-2-dot-1")).toHaveStyle({
        borderColor: "#08090A",
        backgroundColor: "#FFFFFF",
      });
    });

    it("draws single-page steps as before, with no dots", () => {
      render(
        <StepProgress
          testID="a-step-progress"
          steps={4}
          activeIndex={2}
          pages={PAGES}
          activePage={0}
        />,
      );

      expect(screen.queryByTestId("a-step-progress-segment-1-dot-1")).toBeNull();
      expect(screen.queryByTestId("a-step-progress-segment-1-fill")).toBeNull();
    });
  });
});
