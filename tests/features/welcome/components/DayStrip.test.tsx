import { render, screen } from "@tests/helpers/render";

import { DayStrip } from "@/features/welcome/components/DayStrip";
import { lightTheme } from "@/theme/tokens";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

describe("DayStrip", () => {
  it("forwards testID to the outermost view", () => {
    render(<DayStrip testID="a-day-strip" active="Sun" />);

    expect(screen.getByTestId("a-day-strip")).toBeVisible();
  });

  it("renders every day of the week", () => {
    render(<DayStrip testID="a-day-strip" active="Sun" />);

    for (const day of DAYS) {
      expect(screen.getByText(day)).toBeVisible();
    }
  });

  it("colours the active day differently from the rest", () => {
    render(<DayStrip testID="a-day-strip" active="Sun" />);

    const active = screen.getByText("Sun");
    const inactive = screen.getByText("Mon");

    expect(active).toHaveStyle({ color: lightTheme.colors.selected });
    expect(inactive).not.toHaveStyle({ color: lightTheme.colors.selected });
  });

  it("is not interactive", () => {
    render(<DayStrip testID="a-day-strip" active="Sun" />);

    expect(screen.queryByRole("button")).toBeNull();
  });
});
