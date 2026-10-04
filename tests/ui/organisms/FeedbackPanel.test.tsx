import { SafeAreaInsetsContext } from "react-native-safe-area-context";
import { render, screen } from "@tests/helpers/render";

import { lightTheme } from "@/theme/tokens";
import { FeedbackPanel } from "@/ui/organisms/FeedbackPanel";
import { PAGE_INSET } from "@/ui/organisms/Screen";
import { FOOTER_BOTTOM } from "@/ui/organisms/ScreenFooter";
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

  it("fills down to the screen's bottom edge, under the home indicator", () => {
    renderPanel();

    expect(screen.getByTestId("panel")).toHaveStyle({
      marginBottom: -(BOTTOM_INSET + EDGE),
      paddingBottom: BOTTOM_INSET + EDGE + FOOTER_BOTTOM,
    });
  });

  it("reaches just past both sides of the screen", () => {
    renderPanel();

    expect(screen.getByTestId("panel")).toHaveStyle({
      marginHorizontal: -(PAGE_INSET + EDGE),
      paddingHorizontal: PAGE_INSET + EDGE,
    });
  });

  it("draws its edge all the way round, so its rounded corners keep it", () => {
    renderPanel({ tone: "incorrect" });

    expect(screen.getByTestId("panel")).toHaveStyle({ borderWidth: EDGE });
  });
});
