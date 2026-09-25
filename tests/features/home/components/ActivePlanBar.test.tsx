import { render, screen, fireEvent } from "@tests/helpers/render";

import { ActivePlanBar } from "@/features/home/components/ActivePlanBar";

const HREF = { pathname: "/(tabs)/home/[planId]", params: { planId: "plan-1" } } as const;

function renderBar(handlers: { onContinue?: () => void } = {}) {
  return render(
    <ActivePlanBar
      title="Today I Choose to Be a Blessing"
      day="Day 2"
      thumbnailUrl={null}
      colors={["#3D403F", "#1F5A6E", "#1C1D20"]}
      topInset={59}
      touchable
      href={HREF}
      onContinue={handlers.onContinue ?? (() => undefined)}
    />,
  );
}

describe("ActivePlanBar", () => {
  it("shows the plan's title and the day it's on", () => {
    renderBar();

    expect(screen.getByText("Today I Choose to Be a Blessing")).toBeVisible();
    expect(screen.getByText("Day 2")).toBeVisible();
  });

  it("runs up behind the status bar", () => {
    renderBar();

    expect(screen.getByTestId("home-tab-plan-bar")).toHaveStyle({ paddingTop: 59 });
  });

  it("opens the plan — its thumbnail zooming into Plan Detail — saying which", () => {
    renderBar();

    const open = screen.getByTestId("home-tab-plan-bar-open");
    expect(open).toHaveAccessibleName("Today I Choose to Be a Blessing, Day 2");
    expect(open).toHaveProp("accessibilityHint", "Opens the plan");
    expect(screen.getByTestId("home-tab-plan-bar-thumbnail")).toBeOnTheScreen();
  });

  it("continues today's study from its book button", () => {
    const onContinue = jest.fn();
    renderBar({ onContinue });

    fireEvent.press(screen.getByTestId("home-tab-plan-bar-continue"));

    expect(onContinue).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("home-tab-plan-bar-continue")).toHaveAccessibleName("Continue Day 2");
  });

  it("takes no taps until it's in", () => {
    render(
      <ActivePlanBar
        title="Today I Choose to Be a Blessing"
        day="Day 2"
        thumbnailUrl={null}
        colors={[]}
        topInset={0}
        touchable={false}
        href={HREF}
        onContinue={() => undefined}
      />,
    );

    expect(screen.getByTestId("home-tab-plan-bar")).toHaveProp("pointerEvents", "none");
  });
});
