import { render, screen } from "@tests/helpers/render";

import { DayRail } from "@/features/plans/components/DayRail";
import { lightTheme } from "@/theme/tokens";

function renderRail(selected: number) {
  return render(
    <DayRail
      testID="a-rail"
      tileTestIDPrefix="a-day"
      tiles={[1, 2, 3].map((number) => ({
        number,
        date: null,
        mark: null,
        today: number === 1,
        accessibilityLabel: `Day ${number}`,
      }))}
      selected={selected}
      onSelect={() => undefined}
    />,
  );
}

describe("DayRail", () => {
  it("settles on a day, not between two, when it's let go", () => {
    renderRail(1);

    // A day every 64pt.
    expect(screen.getByTestId("a-rail")).toHaveProp("snapToInterval", 64);
    expect(screen.getByTestId("a-rail")).toHaveProp("decelerationRate", "fast");
  });

  it("outlines the day picked — and only it — in black, over whatever it sits on", () => {
    renderRail(1);

    expect(screen.getByTestId("a-rail-tab")).toHaveStyle({
      backgroundColor: "transparent",
      borderColor: lightTheme.colors.text,
      borderWidth: 2,
      borderRadius: 16,
    });
  });

  it("sets the tab under the day picked", () => {
    renderRail(3);

    // The page's 24pt inset, then two days along.
    expect(screen.getByTestId("a-rail-tab")).toHaveStyle({ transform: [{ translateX: 24 + 128 }] });
  });
});
