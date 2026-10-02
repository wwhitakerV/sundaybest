import { render, screen } from "@tests/helpers/render";

import { PrayerHeading } from "@/entities/study/ui/PrayerHeading";
import { lightTheme } from "@/theme/tokens";

describe("PrayerHeading", () => {
  it("shows the title", () => {
    render(<PrayerHeading title="Pray it back" testID="prayer" />);

    expect(screen.getByText("Pray it back")).toBeVisible();
  });

  it("holds its icon in a round 52pt badge in the primary control colour", () => {
    render(<PrayerHeading title="Pray it back" testID="prayer" />);

    expect(screen.getByTestId("prayer-badge")).toHaveStyle({
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: lightTheme.colors.controlPrimary,
    });
  });
});
