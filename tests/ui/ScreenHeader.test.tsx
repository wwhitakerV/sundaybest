import { render, screen } from "@tests/helpers/render";
import { Text } from "react-native";

import { ScreenHeader } from "@/ui/ScreenHeader";
import { useHeaderSide } from "@/ui/header-side";

/** Shows which side of the header it was put on. */
function SideProbe() {
  return <Text>{useHeaderSide()}</Text>;
}

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

  it("tells what's in each slot which side it's on, so buttons arrive from their own edge", () => {
    render(<ScreenHeader title="New plan" left={<SideProbe />} right={<SideProbe />} />);

    expect(screen.getByText("leading")).toBeVisible();
    expect(screen.getByText("trailing")).toBeVisible();
  });
});
