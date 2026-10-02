import { render, screen } from "@tests/helpers/render";

import { WeekDays } from "@/entities/streak";
import { lightTheme } from "@/theme/tokens";

const DAYS = [
  { date: "2026-09-27", completedDayCount: 0 },
  { date: "2026-09-28", completedDayCount: 1 },
];

function renderWeek() {
  return render(<WeekDays days={DAYS} today="2026-09-28" testIDPrefix="week" />);
}

describe("WeekDays", () => {
  it("rings a day not studied in the progress track colour", () => {
    renderWeek();

    expect(screen.getByTestId("week-2026-09-27-ring")).toHaveStyle({
      borderColor: lightTheme.colors.progressTrack,
    });
  });

  it("keeps a studied day's ring in the accent", () => {
    renderWeek();

    expect(screen.getByTestId("week-2026-09-28-ring")).toHaveStyle({
      borderColor: lightTheme.colors.accent,
    });
  });
});
