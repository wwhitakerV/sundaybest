import { render, screen } from "@tests/helpers/render";

import { lightTheme } from "@/theme/tokens";
import { SFProTitle } from "@/ui/typography/SFProTitle";

const { typography, colors } = lightTheme;

describe("SFProTitle", () => {
  it("defaults to the screen variant", () => {
    render(<SFProTitle testID="text">Hello</SFProTitle>);

    expect(screen.getByTestId("text")).toHaveStyle(typography.screenTitle);
  });

  it("defaults to the text colour", () => {
    render(<SFProTitle testID="text">Hello</SFProTitle>);

    expect(screen.getByTestId("text")).toHaveStyle({ color: colors.text });
  });

  it.each([
    ["screen", "screenTitle"],
    ["headline", "headline"],
    ["headlineRegular", "headlineRegular"],
    ["section", "sectionTitle"],
    ["card", "cardTitle"],
    ["step", "stepTitle"],
    ["nav", "navTitle"],
    ["preview", "listItemLarge"],
  ] as const)("sets the %s variant in the %s token", (variant, token) => {
    render(
      <SFProTitle testID="text" variant={variant}>
        Hello
      </SFProTitle>,
    );

    const expected = new Map(Object.entries(typography)).get(token);
    expect(expected).toBeDefined();
    expect(screen.getByTestId("text")).toHaveStyle(expected);
  });
});
