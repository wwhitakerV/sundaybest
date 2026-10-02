import { render, screen } from "@tests/helpers/render";

import { StepKicker } from "@/entities/study/ui/StepKicker";
import { lightTheme } from "@/theme/tokens";

describe("StepKicker", () => {
  it("reads the day, two spaces, then the step", () => {
    render(<StepKicker dayNumber={2} label="Read" testID="kicker" />);

    // Kept as written: the two spaces between the day and the step count.
    expect(screen.getByTestId("kicker")).toHaveTextContent("Day 2  Read", {
      normalizer: (text) => text,
    });
  });

  it("sets the label in the muted text colour", () => {
    render(<StepKicker dayNumber={2} label="Read" testID="kicker" />);

    expect(screen.getByText("Read")).toHaveStyle({ color: lightTheme.colors.textMuted });
  });
});
