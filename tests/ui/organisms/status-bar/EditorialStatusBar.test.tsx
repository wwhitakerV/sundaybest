import { fireEvent, render, screen } from "@tests/helpers/render";

import { EditorialStatusBar } from "@/ui/organisms/status-bar/EditorialStatusBar";
import { lightTheme } from "@/theme/tokens";

const time = { hours: "1", minutes: "03", spoken: "1:03 PM" };
const island = { height: 59, centerY: 29.5, timeX: 66.75, batteryX: 326.25, edged: false };
const battery = (over = {}) => ({
  level: 82,
  tone: "ink" as const,
  italic: false,
  endCap: "dot" as const,
  spoken: "Battery 82 percent",
  ...over,
});

// The time and battery are hidden from VoiceOver (the bar reads them as one line), so found as hidden.
const hidden = { includeHiddenElements: true };

const renderBar = (props: Partial<Parameters<typeof EditorialStatusBar>[0]> = {}) => {
  const onPress = jest.fn();
  render(
    <EditorialStatusBar
      testID="bar"
      time={time}
      battery={battery()}
      tone="dark"
      layout={island}
      onPress={onPress}
      {...props}
    />,
  );
  return { onPress };
};

describe("EditorialStatusBar", () => {
  it("is as tall as the top of the screen it stands in for", () => {
    renderBar();

    expect(screen.getByTestId("bar")).toHaveStyle({ height: 59 });
  });

  it("shows the time, its colon set apart", () => {
    renderBar();

    expect(screen.getByTestId("bar-time", hidden)).toHaveTextContent("1:03");
  });

  it("shows the battery's percentage inside it, and no fill to cross it", () => {
    renderBar();

    expect(screen.getAllByText("82", hidden)).toHaveLength(1);
    expect(screen.getByText("82", hidden)).toHaveStyle({ color: lightTheme.colors.statusInk });
    expect(screen.queryByTestId("bar-battery-fill", hidden)).toBeNull();
  });

  it("sets its percentage in red at 20% or less", () => {
    renderBar({ battery: battery({ level: 14, tone: "low" }) });

    expect(screen.getByText("14", hidden)).toHaveStyle({ color: lightTheme.colors.accent });
  });

  it("sets its percentage in italic in Low Power Mode", () => {
    renderBar({ battery: battery({ italic: true }) });

    expect(screen.getByText("82", hidden)).toHaveStyle({ fontStyle: "italic" });
  });

  it("ends in a full stop while it's unplugged", () => {
    renderBar();

    expect(screen.getByTestId("bar-battery-dot", hidden)).toBeOnTheScreen();
    expect(screen.queryByTestId("bar-battery-bolt", hidden)).toBeNull();
  });

  it("ends in a bolt while it charges", () => {
    renderBar({ battery: battery({ endCap: "bolt" }) });

    expect(screen.queryByTestId("bar-battery-dot", hidden)).toBeNull();
    expect(screen.getByTestId("bar-battery-bolt", hidden)).toBeOnTheScreen();
  });

  it("has no battery when the phone can't say", () => {
    renderBar({ battery: null });

    expect(screen.queryByTestId("bar-battery", hidden)).toBeNull();
  });

  it("draws in white over a dark hero", () => {
    renderBar({ tone: "light" });

    expect(screen.getByText("1", hidden)).toHaveStyle({
      color: lightTheme.colors.statusInkOnDark,
    });
  });

  it("is read by VoiceOver as one thing: the time and the battery", () => {
    renderBar({ battery: battery({ spoken: "Battery 82 percent, charging" }) });

    expect(screen.getByTestId("bar")).toHaveAccessibleName("1:03 PM, Battery 82 percent, charging");
  });

  it("scrolls the page to the top when tapped, as iOS's bar does", () => {
    const { onPress } = renderBar();

    fireEvent.press(screen.getByTestId("bar"));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
