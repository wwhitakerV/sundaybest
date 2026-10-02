import { Circle } from "react-native-svg";
import { render, screen } from "@tests/helpers/render";

import { ProgressRing } from "@/ui/atoms/ProgressRing";

describe("ProgressRing", () => {
  it("is a progress bar that says how far along it is", () => {
    render(<ProgressRing testID="a-ring" percent={40} />);

    expect(screen.getByTestId("a-ring")).toHaveProp("accessibilityValue", {
      min: 0,
      max: 100,
      now: 40,
    });
  });

  it("is 160pt across, as every hero ring is", () => {
    render(<ProgressRing testID="a-ring" percent={40} />);

    expect(screen.getByTestId("a-ring")).toHaveStyle({ width: 160, height: 160 });
  });

  it("draws its track and its arc 10pt thick, as every hero ring's band is", () => {
    render(<ProgressRing testID="a-ring" percent={40} />);

    for (const circle of screen.UNSAFE_getAllByType(Circle)) {
      expect(circle.props.strokeWidth).toBe(10);
    }
  });

  it("shows its label inside, or the percentage", () => {
    render(<ProgressRing testID="a-ring" percent={40} label="2/3" />);

    expect(screen.getByText("2/3")).toBeVisible();
  });
});
