import { View, processColor } from "react-native";
import { render, screen } from "@tests/helpers/render";

import { lightTheme } from "@/theme/tokens";
import { ProgressDial } from "@/ui/atoms/ProgressDial";

/** How react-native-svg holds a stroke colour once it has processed it. */
function svgColor(color: string) {
  return { type: 0, payload: processColor(color) };
}

describe("ProgressDial", () => {
  it("is a progress bar that says how far along it is", () => {
    render(<ProgressDial testID="a-dial" percent={40} />);

    const node = screen.getByTestId("a-dial");
    expect(node).toHaveProp("accessibilityRole", "progressbar");
    expect(node).toHaveProp("accessibilityValue", { min: 0, max: 100, now: 40 });
  });

  it("sits on a solid white disc, the page's own colour", () => {
    render(<ProgressDial testID="a-dial" percent={40} />);

    const disc = screen.getByTestId("a-dial-disc");
    expect(disc).toHaveProp("fill", svgColor(lightTheme.colors.background));
    expect(disc.props.strokeWidth ?? 0).toBe(0);
  });

  it("draws its arc in the accent", () => {
    render(<ProgressDial testID="a-dial" percent={40} />);

    expect(screen.getByTestId("a-dial-arc")).toHaveProp(
      "stroke",
      svgColor(lightTheme.colors.accent),
    );
  });

  it("draws no arc at 0%", () => {
    render(<ProgressDial testID="a-dial" percent={0} />);

    expect(screen.queryByTestId("a-dial-arc")).toBeNull();
  });

  it("closes the arc at 100%", () => {
    render(<ProgressDial testID="a-dial" percent={100} />);

    expect(Number(screen.getByTestId("a-dial-arc").props.strokeDashoffset)).toBeCloseTo(0, 2);
  });

  it("leaves half the circumference undrawn at 50%", () => {
    render(<ProgressDial testID="a-dial" percent={50} />);

    const circumference = 2 * Math.PI * Number(screen.getByTestId("a-dial-arc").props.r);
    expect(Number(screen.getByTestId("a-dial-arc").props.strokeDashoffset)).toBeCloseTo(
      circumference / 2,
      2,
    );
  });

  it("draws what it's given in its middle", () => {
    render(
      <ProgressDial testID="a-dial" percent={40}>
        <View testID="a-mark" />
      </ProgressDial>,
    );

    expect(screen.getByTestId("a-mark")).toBeOnTheScreen();
  });

  it("is 42pt across", () => {
    render(<ProgressDial testID="a-dial" percent={40} />);

    expect(screen.getByTestId("a-dial")).toHaveStyle({ width: 42, height: 42 });
  });

  it("draws a thin red line, 3pt", () => {
    render(<ProgressDial testID="a-dial" percent={40} />);

    expect(Number(screen.getByTestId("a-dial-arc").props.strokeWidth)).toBe(3);
  });

  it("keeps the red line 2pt in from the disc's edge", () => {
    render(<ProgressDial testID="a-dial" percent={40} />);

    const disc = Number(screen.getByTestId("a-dial-disc").props.r);
    const arc = screen.getByTestId("a-dial-arc").props;
    expect(disc - (Number(arc.r) + Number(arc.strokeWidth) / 2)).toBe(2);
  });

  it("can be bare — no disc, just its ring on a faint track — and small", () => {
    render(<ProgressDial testID="a-dial" percent={40} bare size={24} />);

    expect(screen.getByTestId("a-dial")).toHaveStyle({ width: 24, height: 24 });
    expect(screen.queryByTestId("a-dial-disc")).toBeNull();
    expect(screen.getByTestId("a-dial-track")).toBeOnTheScreen();
  });

  it("draws a bare ring's progress in white, firm enough to see, on its faint white track", () => {
    render(<ProgressDial testID="a-dial" percent={40} bare size={24} />);

    expect(screen.getByTestId("a-dial-arc")).toHaveProp(
      "stroke",
      svgColor(lightTheme.colors.inkOnDark),
    );
    expect(screen.getByTestId("a-dial-arc")).toHaveProp("strokeWidth", 3.5);
    expect(screen.getByTestId("a-dial-track")).toHaveProp(
      "stroke",
      svgColor(lightTheme.colors.inkOnDarkFaint),
    );
  });
});
