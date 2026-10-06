import { render, screen } from "@tests/helpers/render";

import { lightTheme } from "@/theme/tokens";
import { Spinner } from "@/ui/atoms/Spinner";

describe("Spinner", () => {
  it("is an unfilled ring whose accent arc runs on the progress track", () => {
    render(<Spinner testID="a-spinner" />);

    expect(screen.getByTestId("a-spinner")).toHaveStyle({
      borderColor: lightTheme.colors.progressTrack,
      borderTopColor: lightTheme.colors.accent,
      backgroundColor: "transparent",
    });
  });

  it("is drawn at the size it's given", () => {
    render(<Spinner testID="a-spinner" size={28} />);

    expect(screen.getByTestId("a-spinner")).toHaveStyle({
      width: 28,
      height: 28,
      borderRadius: 14,
    });
  });

  it("tells assistive tech it's busy", () => {
    render(<Spinner testID="a-spinner" />);

    expect(screen.getByTestId("a-spinner")).toBeBusy();
  });
});
