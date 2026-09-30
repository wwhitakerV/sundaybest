import { Text } from "react-native";
import { render, screen } from "@tests/helpers/render";

import { FLOATING_NAV_BAR, getFloatingNavBarBottom } from "@/ui/floatingNavBar";
import { FloatingBar } from "@/ui/FloatingBar";

describe("FloatingBar", () => {
  it("floats where every bar does: in from the sides, up from the bottom", () => {
    render(
      <FloatingBar testID="a-bar">
        <Text>Begin</Text>
      </FloatingBar>,
    );

    expect(screen.getByTestId("a-bar")).toHaveStyle({
      position: "absolute",
      left: FLOATING_NAV_BAR.sideMargin,
      right: FLOATING_NAV_BAR.sideMargin,
      bottom: getFloatingNavBarBottom(0),
    });
  });

  it("lays what it holds in one row, as tall as a bar", () => {
    render(
      <FloatingBar testID="a-bar">
        <Text>Begin</Text>
      </FloatingBar>,
    );

    expect(screen.getByTestId("a-bar-row")).toHaveStyle({
      flexDirection: "row",
      height: FLOATING_NAV_BAR.capsuleHeight,
    });
    expect(screen.getByText("Begin")).toBeVisible();
  });

  it("hides what scrolls under it behind the page's fade, as the other bars do", () => {
    render(
      <FloatingBar testID="a-bar">
        <Text>Begin</Text>
      </FloatingBar>,
    );

    expect(screen.getByTestId("a-bar-tint", { includeHiddenElements: true })).toBeOnTheScreen();
  });
});
