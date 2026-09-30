import { render, screen } from "@tests/helpers/render";

import { lightTheme } from "@/theme/tokens";
import { RadioMark } from "@/ui/RadioMark";

describe("RadioMark", () => {
  it("is an empty ring, in the stronger border, when it isn't picked", () => {
    render(<RadioMark testID="a-radio" selected={false} />);

    expect(screen.getByTestId("a-radio")).toHaveStyle({
      borderColor: lightTheme.colors.borderStrong,
    });
    expect(screen.queryByTestId("a-radio-dot")).toBeNull();
  });

  it("is an accent ring around an accent dot when it's picked", () => {
    render(<RadioMark testID="a-radio" selected />);

    expect(screen.getByTestId("a-radio")).toHaveStyle({ borderColor: lightTheme.colors.accent });
    expect(screen.getByTestId("a-radio-dot")).toHaveStyle({
      backgroundColor: lightTheme.colors.accent,
    });
  });
});
