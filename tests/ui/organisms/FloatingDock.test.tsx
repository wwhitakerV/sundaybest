import { Text } from "react-native";
import { Stop } from "react-native-svg";
import { render, screen } from "@tests/helpers/render";

import { edgeFade } from "@/theme";
import { FloatingDock } from "@/ui/organisms/FloatingDock";
import {
  FLOATING_NAV_BAR,
  getFloatingNavBarBottom,
  getFloatingNavBarTintHeight,
} from "@/ui/organisms/floatingNavBar";

function stopOpacities(within: ReturnType<typeof screen.getByTestId>) {
  return within
    .findAll((node) => node.type === Stop)
    .map((stop) => stop.props.stopOpacity as unknown);
}

function renderDock() {
  return render(
    <FloatingDock testID="a-dock">
      <Text>Done</Text>
    </FloatingDock>,
  );
}

describe("FloatingDock", () => {
  it("floats where the tab bar's pill does: in from the sides, up from the screen's bottom", () => {
    renderDock();

    expect(screen.getByTestId("a-dock")).toHaveStyle({
      position: "absolute",
      left: FLOATING_NAV_BAR.sideMargin,
      right: FLOATING_NAV_BAR.sideMargin,
      bottom: getFloatingNavBarBottom(0),
    });
  });

  it("holds what it's given in a row as tall as the pill", () => {
    renderDock();

    expect(screen.getByTestId("a-dock-row")).toHaveStyle({
      height: FLOATING_NAV_BAR.capsuleHeight,
    });
    expect(screen.getByText("Done")).toBeVisible();
  });

  it("sits on the tab bar's tint, from the screen's bottom edge to a little above the pill", () => {
    renderDock();
    const capsuleBottom = getFloatingNavBarBottom(0);

    expect(screen.getByTestId("a-dock-tint", { includeHiddenElements: true })).toHaveStyle({
      bottom: -capsuleBottom,
      height: getFloatingNavBarTintHeight(capsuleBottom),
    });
  });

  it("tints behind its pill at the edges' lighter peak, never fully opaque", () => {
    renderDock();

    const tint = screen.getByTestId("a-dock-tint", { includeHiddenElements: true });
    expect(Math.max(...(stopOpacities(tint) as number[]))).toBe(edgeFade.peak);
  });
});
