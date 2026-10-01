import { render, screen } from "@tests/helpers/render";

import { lightTheme } from "@/theme/tokens";
import { MonoLabel } from "@/ui/typography/MonoLabel";

const { typography, colors } = lightTheme;

describe("MonoLabel", () => {
  it("defaults to the label variant", () => {
    render(<MonoLabel testID="text">Hello</MonoLabel>);

    expect(screen.getByTestId("text")).toHaveStyle(typography.metaLabel);
  });

  it("defaults to the text colour", () => {
    render(<MonoLabel testID="text">Hello</MonoLabel>);

    expect(screen.getByTestId("text")).toHaveStyle({ color: colors.text });
  });

  it.each([
    ["label", "metaLabel"],
    ["labelTracked", "metaLabelTracked"],
    ["date", "tileDate"],
    ["dayStrip", "dayStrip"],
    ["emphasis", "metaEmphasis"],
  ] as const)("sets the %s variant in the %s token", (variant, token) => {
    render(
      <MonoLabel testID="text" variant={variant}>
        Hello
      </MonoLabel>,
    );

    const expected = new Map(Object.entries(typography)).get(token);
    expect(expected).toBeDefined();
    expect(screen.getByTestId("text")).toHaveStyle(expected);
  });
});
