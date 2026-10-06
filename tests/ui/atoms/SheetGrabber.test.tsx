import { render, screen } from "@tests/helpers/render";

import { lightTheme } from "@/theme/tokens";
import { SHEET_GRABBER, SheetGrabber } from "@/ui/atoms/SheetGrabber";

describe("SheetGrabber", () => {
  it("is 48pt wide — 8pt wider than iOS's own — and 5pt tall", () => {
    render(<SheetGrabber testID="a-grabber" />);

    expect(screen.getByTestId("a-grabber")).toHaveStyle({ width: 48, height: 5 });
    expect(SHEET_GRABBER.width).toBe(48);
  });

  it("is drawn in the grabber colour", () => {
    render(<SheetGrabber testID="a-grabber" />);

    expect(screen.getByTestId("a-grabber")).toHaveStyle({
      backgroundColor: lightTheme.colors.grabber,
    });
  });
});
