import { render, screen, fireEvent } from "@tests/helpers/render";

import { StudyHeader } from "@/features/plans/components/StudyHeader";

describe("StudyHeader", () => {
  it("shows the day context as the header title", () => {
    render(
      <StudyHeader
        testID="a-study-header"
        day={2}
        totalDays={6}
        onClose={() => undefined}
        onTextSize={() => undefined}
      />,
    );

    expect(screen.getByText("Day 2 of 6")).toBeVisible();
  });

  it("calls onClose when the close button is pressed", () => {
    const onClose = jest.fn();
    render(
      <StudyHeader
        testID="a-study-header"
        day={2}
        totalDays={6}
        onClose={onClose}
        onTextSize={() => undefined}
      />,
    );

    fireEvent.press(screen.getByTestId("a-study-header-close-button"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onTextSize when the text-size button is pressed", () => {
    const onTextSize = jest.fn();
    render(
      <StudyHeader
        testID="a-study-header"
        day={2}
        totalDays={6}
        onClose={() => undefined}
        onTextSize={onTextSize}
      />,
    );

    fireEvent.press(screen.getByTestId("a-study-header-text-size-button"));

    expect(onTextSize).toHaveBeenCalledTimes(1);
  });

  it("shows a 4-segment step tracker at the given step", () => {
    render(
      <StudyHeader
        testID="a-study-header"
        day={2}
        totalDays={6}
        step={1}
        onClose={() => undefined}
        onTextSize={() => undefined}
      />,
    );

    expect(screen.getByTestId("a-study-header-progress-segment-0")).toBeVisible();
    expect(screen.getByTestId("a-study-header-progress-segment-3")).toBeVisible();
    expect(screen.queryByTestId("a-study-header-progress-segment-4")).toBeNull();
  });

  it("shows the Read/Scripture/Reflect/Pray labels beneath the tracker", () => {
    render(
      <StudyHeader
        testID="a-study-header"
        day={2}
        totalDays={6}
        step={1}
        onClose={() => undefined}
        onTextSize={() => undefined}
      />,
    );

    expect(screen.getByText("Read")).toBeVisible();
    expect(screen.getByText("Scripture")).toBeVisible();
    expect(screen.getByText("Reflect")).toBeVisible();
    expect(screen.getByText("Pray")).toBeVisible();
  });

  it("colours the active step's label black and the rest grey", () => {
    render(
      <StudyHeader
        testID="a-study-header"
        day={2}
        totalDays={6}
        step={1}
        onClose={() => undefined}
        onTextSize={() => undefined}
      />,
    );

    expect(screen.getByTestId("a-study-header-progress-label-1")).toHaveStyle({
      color: "#000000",
    });
    expect(screen.getByTestId("a-study-header-progress-label-0")).toHaveStyle({
      color: "#A1A1AA",
    });
    expect(screen.getByTestId("a-study-header-progress-label-3")).toHaveStyle({
      color: "#A1A1AA",
    });
  });

  it("hides the labels when step is omitted", () => {
    render(
      <StudyHeader
        testID="a-study-header"
        day={2}
        totalDays={6}
        onClose={() => undefined}
        onTextSize={() => undefined}
      />,
    );

    expect(screen.queryByText("Read")).toBeNull();
  });
});
