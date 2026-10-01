import { render, screen } from "@tests/helpers/render";

import { lightTheme } from "@/theme/tokens";
import { DisplayTitle } from "@/ui/typography/DisplayTitle";

const { typography, colors } = lightTheme;

describe("DisplayTitle", () => {
  it("sets the display type", () => {
    render(<DisplayTitle testID="text">Hello</DisplayTitle>);

    expect(screen.getByTestId("text")).toHaveStyle(typography.display);
  });

  it("defaults to the text colour", () => {
    render(<DisplayTitle testID="text">Hello</DisplayTitle>);

    expect(screen.getByTestId("text")).toHaveStyle({ color: colors.text });
  });
});
