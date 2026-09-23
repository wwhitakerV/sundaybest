import { render, screen } from "@test/render";
import { Text } from "react-native";

import { ScreenHeader } from "./ScreenHeader";

describe("ScreenHeader", () => {
  it("forwards testID to the outermost view", () => {
    render(<ScreenHeader testID="a-screen-header" title="New plan" />);

    expect(screen.getByTestId("a-screen-header")).toBeVisible();
  });

  it("renders a plain title string", () => {
    render(<ScreenHeader testID="a-screen-header" title="New plan" />);

    expect(screen.getByText("New plan")).toBeVisible();
  });

  it("renders a left slot when given one", () => {
    render(
      <ScreenHeader
        testID="a-screen-header"
        title="New plan"
        left={<Text testID="left-slot">left</Text>}
      />,
    );

    expect(screen.getByTestId("left-slot")).toBeVisible();
  });

  it("renders a right slot when given one", () => {
    render(
      <ScreenHeader
        testID="a-screen-header"
        title="New plan"
        right={<Text testID="right-slot">right</Text>}
      />,
    );

    expect(screen.getByTestId("right-slot")).toBeVisible();
  });

  it("has a 54pt minimum height", () => {
    render(<ScreenHeader testID="a-screen-header" title="New plan" />);

    expect(screen.getByTestId("a-screen-header")).toHaveStyle({ minHeight: 54 });
  });
});
