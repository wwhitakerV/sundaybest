import { render, screen } from "@tests/helpers/render";

import { lightTheme } from "@/theme/tokens";
import { SerifTitle } from "@/ui/typography/SerifTitle";

const { typography, colors } = lightTheme;

describe("SerifTitle", () => {
  it("defaults to the heading variant", () => {
    render(<SerifTitle testID="text">Hello</SerifTitle>);

    expect(screen.getByTestId("text")).toHaveStyle(typography.editorialHeading);
  });

  it("defaults to the text colour", () => {
    render(<SerifTitle testID="text">Hello</SerifTitle>);

    expect(screen.getByTestId("text")).toHaveStyle({ color: colors.text });
  });

  it.each([
    ["heading", "editorialHeading"],
    ["title", "editorialTitle"],
    ["question", "editorialQuestion"],
    ["quiz", "quizQuestion"],
    ["statement", "statement"],
  ] as const)("sets the %s variant in the %s token", (variant, token) => {
    render(
      <SerifTitle testID="text" variant={variant}>
        Hello
      </SerifTitle>,
    );

    const expected = new Map(Object.entries(typography)).get(token);
    expect(expected).toBeDefined();
    expect(screen.getByTestId("text")).toHaveStyle(expected);
  });
});
