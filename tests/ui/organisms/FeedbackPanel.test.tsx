import { SafeAreaInsetsContext } from "react-native-safe-area-context";
import { render, screen } from "@tests/helpers/render";

import { lightTheme } from "@/theme/tokens";
import { FeedbackPanel } from "@/ui/organisms/FeedbackPanel";
import { PAGE_INSET } from "@/ui/organisms/Screen";
import { FLOATING_NAV_BAR, getFloatingNavBarBottom } from "@/ui/organisms/floatingNavBar";
import { Text } from "react-native";

/** An iPhone's home indicator. */
const BOTTOM_INSET = 34;
/** How far the panel's edge sits past the screen, so only its curve shows. */
const EDGE = 1;

function renderPanel(
  props: { tone?: "correct" | "incorrect"; detail?: string } = {},
  children: React.ReactNode = null,
) {
  return render(
    <SafeAreaInsetsContext.Provider value={{ top: 0, right: 0, bottom: BOTTOM_INSET, left: 0 }}>
      <FeedbackPanel testID="panel" tone={props.tone ?? "correct"} title="A title" {...props}>
        {children}
      </FeedbackPanel>
    </SafeAreaInsetsContext.Provider>,
  );
}

describe("FeedbackPanel", () => {
  it("shows its title", () => {
    renderPanel();

    expect(screen.getByText("A title")).toBeVisible();
  });

  it("shows the detail when given", () => {
    renderPanel({ detail: "Some reason." });

    expect(screen.getByText("Some reason.")).toBeVisible();
  });

  it("shows no detail when none is given", () => {
    renderPanel();

    expect(screen.queryByText("Some reason.")).toBeNull();
  });

  it("renders its children, the way on", () => {
    renderPanel({}, <Text>Way on</Text>);

    expect(screen.getByText("Way on")).toBeVisible();
  });

  it("is drawn in the incorrect colours when incorrect", () => {
    renderPanel({ tone: "incorrect" });

    expect(screen.getByTestId("panel")).toHaveStyle({
      backgroundColor: lightTheme.colors.incorrectSurface,
      borderColor: lightTheme.colors.incorrectBorder,
    });
  });

  it("is drawn in the correct colours when correct", () => {
    renderPanel({ tone: "correct" });

    expect(screen.getByTestId("panel")).toHaveStyle({
      backgroundColor: lightTheme.colors.correctSurface,
      borderColor: lightTheme.colors.correctBorder,
    });
  });

  it("fills down to the screen's bottom edge, its button where the dock's pill sits", () => {
    renderPanel();

    expect(screen.getByTestId("panel")).toHaveStyle({
      marginBottom: -EDGE,
      paddingBottom: getFloatingNavBarBottom(BOTTOM_INSET) + EDGE,
    });
  });

  it("holds its button in a row as tall as the dock's", () => {
    renderPanel({}, <Text>Way on</Text>);

    expect(screen.getByTestId("panel-action")).toHaveStyle({
      height: FLOATING_NAV_BAR.capsuleHeight,
    });
  });

  it("reaches just past both sides of the screen, its button as far in as the dock's", () => {
    renderPanel();

    expect(screen.getByTestId("panel")).toHaveStyle({
      marginHorizontal: -EDGE,
      paddingHorizontal: FLOATING_NAV_BAR.sideMargin + EDGE,
    });
  });

  it("keeps its words at the page inset", () => {
    renderPanel();

    expect(screen.getByTestId("panel-words")).toHaveStyle({
      paddingHorizontal: PAGE_INSET - FLOATING_NAV_BAR.sideMargin,
    });
  });

  it("draws its edge all the way round, so its rounded corners keep it", () => {
    renderPanel({ tone: "incorrect" });

    expect(screen.getByTestId("panel")).toHaveStyle({ borderWidth: EDGE });
  });
});
