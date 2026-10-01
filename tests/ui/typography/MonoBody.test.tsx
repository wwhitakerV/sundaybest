import { render, screen } from "@tests/helpers/render";

import { lightTheme } from "@/theme/tokens";
import { MonoBody } from "@/ui/typography/MonoBody";

const { typography, colors } = lightTheme;

describe("MonoBody", () => {
  it("defaults to the body variant", () => {
    render(<MonoBody testID="text">Hello</MonoBody>);

    expect(screen.getByTestId("text")).toHaveStyle(typography.metaBody);
  });

  it("defaults to the text colour", () => {
    render(<MonoBody testID="text">Hello</MonoBody>);

    expect(screen.getByTestId("text")).toHaveStyle({ color: colors.text });
  });

  it.each([
    ["body", "metaBody"],
    ["supporting", "supporting"],
    ["counter", "stepCounter"],
  ] as const)("sets the %s variant in the %s token", (variant, token) => {
    render(
      <MonoBody testID="text" variant={variant}>
        Hello
      </MonoBody>,
    );

    const expected = new Map(Object.entries(typography)).get(token);
    expect(expected).toBeDefined();
    expect(screen.getByTestId("text")).toHaveStyle(expected);
  });
});
