import { render, screen } from "@tests/helpers/render";

import { StreakBurst } from "@/ui/burst/StreakBurst";
import { makeRadialStreaks } from "@/utils/burst/makeRadialStreaks";

const STREAKS = makeRadialStreaks({
  count: 5,
  centerDeg: 90,
  spreadDeg: 60,
  reach: 28,
  length: 9,
  shortRatio: 0.6,
});

describe("StreakBurst", () => {
  it("draws one streak for each in the fan", () => {
    render(<StreakBurst testID="a-burst" trigger="go" streaks={STREAKS} />);

    expect(screen.getByTestId("a-burst").children).toHaveLength(5);
  });

  it("never takes touches", () => {
    render(<StreakBurst testID="a-burst" trigger="go" streaks={STREAKS} />);

    expect(screen.getByTestId("a-burst")).toHaveProp("pointerEvents", "none");
  });
});
