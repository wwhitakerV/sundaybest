import { render, screen, fireEvent } from "@tests/helpers/render";

import { SelectedDay, type SelectedDayProps } from "@/features/plans/components/SelectedDay";
import type { DayPanelLook, DayStepLook } from "@/features/plans/logic/day-rail";
import { lightTheme } from "@/theme/tokens";

const { colors, typography } = lightTheme;

function steps(status: DayStepLook["status"]): DayStepLook[] {
  return [
    ["read", "Read"],
    ["scripture", "Scripture"],
    ["reflect", "Reflect"],
    ["pray", "Pray"],
    ["quickCheck", "Quick Check"],
  ].map(([key, label]) => ({
    key: key as DayStepLook["key"],
    label: label ?? "",
    detail: null,
    status,
    accessibilityLabel: `${label ?? ""}, ${status}`,
  }));
}

const TODAY: DayPanelLook = {
  state: "today",
  eyebrow: "Today · Day 2 of 6",
  meta: "5 min · 2 of 5 done",
};
const DONE: DayPanelLook = {
  state: "done",
  eyebrow: "Completed · Day 1 of 6",
  meta: "5 min · Finished Sep 22",
};
const LOCKED: DayPanelLook = { state: "locked", eyebrow: "Locked · Day 3 of 6", meta: "5 min" };

function renderDay(overrides: Partial<SelectedDayProps> = {}) {
  return render(
    <SelectedDay
      testID="a-day"
      contentKey="day-2"
      stepTestIDPrefix="a-step"
      title="Grace is received"
      panel={TODAY}
      steps={steps("upcoming")}
      onOpenStep={() => undefined}
      {...overrides}
    />,
  );
}

describe("SelectedDay", () => {
  describe("the day the plan's on", () => {
    it("sits on a soft surface, its steps on white rows over it", () => {
      renderDay();

      expect(screen.getByTestId("a-day")).toHaveStyle({ backgroundColor: colors.surface });
      expect(screen.getByTestId("a-step-read")).toHaveStyle({
        backgroundColor: colors.background,
      });
    });

    it("leads with today, in SundayBest red, in capitals", () => {
      renderDay();

      expect(screen.getByText("Today · Day 2 of 6")).toHaveStyle({
        color: colors.accent,
        textTransform: "uppercase",
      });
    });

    it("sets its title largest", () => {
      renderDay();

      expect(screen.getByRole("header", { name: "Grace is received" })).toHaveStyle(
        typography.editorialTitle,
      );
      expect(screen.getByText("5 min · 2 of 5 done")).toBeVisible();
    });
  });

  describe("a finished day", () => {
    it("sits lighter, on white with a hairline edge", () => {
      renderDay({ panel: DONE, steps: steps("done") });

      expect(screen.getByTestId("a-day")).toHaveStyle({
        backgroundColor: colors.background,
        borderColor: colors.hairline,
        borderWidth: 1,
      });
    });

    it("says it's completed, ticked in green", () => {
      renderDay({ panel: DONE, steps: steps("done") });

      expect(screen.getByText("Completed · Day 1 of 6")).toHaveStyle({ color: colors.correct });
      expect(screen.getByTestId("a-day-check")).toBeOnTheScreen();
    });
  });

  describe("a locked day", () => {
    it("has no surface, only a hairline edge", () => {
      renderDay({ panel: LOCKED, steps: steps("locked") });

      expect(screen.getByTestId("a-day")).toHaveStyle({
        backgroundColor: "transparent",
        borderColor: colors.hairline,
      });
    });

    it("says it's locked, quietly, under a lock", () => {
      renderDay({ panel: LOCKED, steps: steps("locked") });

      expect(screen.getByText("Locked · Day 3 of 6")).toHaveStyle({ color: colors.textMuted });
      expect(screen.getByTestId("a-day-lock")).toBeOnTheScreen();
      expect(screen.getByRole("header", { name: "Grace is received" })).toHaveStyle({
        color: colors.textMuted,
      });
    });
  });

  it("gives each step its own colour", () => {
    renderDay();

    expect(screen.getByTestId("a-step-read-icon")).toHaveStyle({
      backgroundColor: colors.stepReadTint,
    });
    expect(screen.getByTestId("a-step-scripture-icon")).toHaveStyle({
      backgroundColor: colors.stepScriptureTint,
    });
    expect(screen.getByTestId("a-step-quickCheck-icon")).toHaveStyle({
      backgroundColor: colors.stepQuickCheckTint,
    });
  });

  it("opens the step pressed", () => {
    const onOpenStep = jest.fn();
    renderDay({ onOpenStep });

    fireEvent.press(screen.getByTestId("a-step-quickCheck"));

    expect(onOpenStep).toHaveBeenCalledWith("quickCheck");
  });
});
