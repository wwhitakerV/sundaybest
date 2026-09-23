import { render, screen, fireEvent } from "@test/render";

import { SegmentedControl } from "./SegmentedControl";

const OPTIONS = ["Week", "Month"] as const;

describe("SegmentedControl", () => {
  it("forwards testID to the outermost view", () => {
    render(
      <SegmentedControl
        testID="a-segmented-control"
        options={OPTIONS}
        selected="Week"
        onSelect={() => undefined}
      />,
    );

    expect(screen.getByTestId("a-segmented-control")).toBeVisible();
  });

  it("renders every option", () => {
    render(
      <SegmentedControl
        testID="a-segmented-control"
        options={OPTIONS}
        selected="Week"
        onSelect={() => undefined}
      />,
    );

    expect(screen.getByText("Week")).toBeVisible();
    expect(screen.getByText("Month")).toBeVisible();
  });

  it("calls onSelect with the pressed option", () => {
    const onSelect = jest.fn();
    render(
      <SegmentedControl
        testID="a-segmented-control"
        options={OPTIONS}
        selected="Week"
        onSelect={onSelect}
      />,
    );

    fireEvent.press(screen.getByText("Month"));

    expect(onSelect).toHaveBeenCalledWith("Month");
  });

  it("gives the selected segment an active background", () => {
    render(
      <SegmentedControl
        testID="a-segmented-control"
        options={OPTIONS}
        selected="Week"
        onSelect={() => undefined}
      />,
    );

    expect(screen.getByTestId("a-segmented-control-option-Week")).toHaveStyle({
      backgroundColor: "rgba(0, 0, 0, 0.09)",
    });
  });

  it("leaves an unselected segment transparent", () => {
    render(
      <SegmentedControl
        testID="a-segmented-control"
        options={OPTIONS}
        selected="Week"
        onSelect={() => undefined}
      />,
    );

    expect(screen.getByTestId("a-segmented-control-option-Month")).toHaveStyle({
      backgroundColor: "transparent",
    });
  });
});
