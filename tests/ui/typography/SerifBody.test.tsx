import { render, screen } from "@tests/helpers/render";

import { lightTheme } from "@/theme/tokens";
import { SerifBody } from "@/ui/typography/SerifBody";

const { typography, colors } = lightTheme;

describe("SerifBody", () => {
  it("defaults to the scripture variant", () => {
    render(<SerifBody testID="text">Hello</SerifBody>);

    expect(screen.getByTestId("text")).toHaveStyle(typography.scripture);
  });

  it("defaults to the text colour", () => {
    render(<SerifBody testID="text">Hello</SerifBody>);

    expect(screen.getByTestId("text")).toHaveStyle({ color: colors.text });
  });

  it.each([["scripture", "scripture"]] as const)(
    "sets the %s variant in the %s token",
    (variant, token) => {
      render(
        <SerifBody testID="text" variant={variant}>
          Hello
        </SerifBody>,
      );

      const expected = new Map(Object.entries(typography)).get(token);
      expect(expected).toBeDefined();
      expect(screen.getByTestId("text")).toHaveStyle(expected);
    },
  );
});
