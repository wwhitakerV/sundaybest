import { render, screen } from "@tests/helpers/render";

import { lightTheme } from "@/theme/tokens";
import { SFProLabel } from "@/ui/typography/SFProLabel";

const { typography, colors } = lightTheme;

describe("SFProLabel", () => {
  it("defaults to the button variant", () => {
    render(<SFProLabel testID="text">Hello</SFProLabel>);

    expect(screen.getByTestId("text")).toHaveStyle(typography.button);
  });

  it("defaults to the text colour", () => {
    render(<SFProLabel testID="text">Hello</SFProLabel>);

    expect(screen.getByTestId("text")).toHaveStyle({ color: colors.text });
  });

  it.each([
    ["button", "button"],
    ["compactButton", "compactButton"],
    ["segment", "segmentLabel"],
    ["segmentActive", "segmentLabelActive"],
    ["filter", "filterLabel"],
    ["filterCount", "filterCount"],
    ["tag", "tag"],
    ["stepLabel", "stepLabel"],
    ["tileNumber", "tileNumber"],
    ["statusTime", "statusTime"],
  ] as const)("sets the %s variant in the %s token", (variant, token) => {
    render(
      <SFProLabel testID="text" variant={variant}>
        Hello
      </SFProLabel>,
    );

    const expected = new Map(Object.entries(typography)).get(token);
    expect(expected).toBeDefined();
    expect(screen.getByTestId("text")).toHaveStyle(expected);
  });
});
