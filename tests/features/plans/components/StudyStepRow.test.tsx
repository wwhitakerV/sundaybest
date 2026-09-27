import { BookOpen } from "lucide-react-native";
import { render, screen, fireEvent } from "@tests/helpers/render";

import { StudyStepRow, type StudyStepRowProps } from "@/features/plans/components/StudyStepRow";
import type { DayStepLook } from "@/features/plans/logic/day-rail";
import { lightTheme } from "@/theme/tokens";

const { colors, typography } = lightTheme;

function step(status: DayStepLook["status"]): DayStepLook {
  return {
    key: "read",
    label: "Read",
    detail: "Grace is received",
    status,
    accessibilityLabel: `Read, ${status}, Grace is received`,
  };
}

function renderRow(overrides: Partial<StudyStepRowProps> = {}) {
  return render(
    <StudyStepRow
      testID="a-step"
      look={step("upcoming")}
      icon={BookOpen}
      colour={colors.stepRead}
      tint={colors.stepReadTint}
      raised
      onPress={() => undefined}
      {...overrides}
    />,
  );
}

describe("StudyStepRow", () => {
  it("sets its name, and what it holds, firm and clear", () => {
    renderRow();

    expect(screen.getByText("Read")).toHaveStyle(typography.stepTitle);
    expect(screen.getByText("Grace is received")).toHaveStyle(typography.stepDetail);
  });

  it("sits on a white row of its own when raised", () => {
    renderRow();

    expect(screen.getByTestId("a-step")).toHaveStyle({ backgroundColor: colors.background });
  });

  it("sits straight on the panel otherwise", () => {
    renderRow({ raised: false });

    expect(screen.getByTestId("a-step")).toHaveStyle({ backgroundColor: "transparent" });
  });

  it("fills a done step's icon square with its colour, and ticks it", () => {
    renderRow({ look: step("done") });

    expect(screen.getByTestId("a-step-icon")).toHaveStyle({ backgroundColor: colors.stepRead });
    expect(screen.getByTestId("a-step-done")).toBeOnTheScreen();
  });

  it("edges the next step in its colour, and tags it next", () => {
    renderRow({ look: step("current") });

    expect(screen.getByTestId("a-step")).toHaveStyle({
      borderColor: colors.stepRead,
      borderWidth: 1.5,
    });
    expect(screen.getByTestId("a-step-next")).toHaveStyle({ backgroundColor: colors.stepRead });
    expect(screen.getByText("Next")).toBeOnTheScreen();
  });

  it("tints a step still to come, with a quiet way in", () => {
    renderRow({ look: step("upcoming") });

    expect(screen.getByTestId("a-step-icon")).toHaveStyle({ backgroundColor: colors.stepReadTint });
    expect(screen.getByTestId("a-step-chevron")).toBeOnTheScreen();
    expect(screen.getByText("Read")).toHaveStyle({ color: colors.textInactive });
  });

  it("opens the step", () => {
    const onPress = jest.fn();
    renderRow({ onPress });

    fireEvent.press(screen.getByTestId("a-step"));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("holds a step not open yet, without a way in", () => {
    renderRow({ look: step("waiting") });

    expect(screen.getByTestId("a-step")).toBeDisabled();
    expect(screen.queryByTestId("a-step-chevron")).toBeNull();
  });

  it("locks a locked day's step: a lock in place of its icon, its words muted", () => {
    renderRow({ look: step("locked") });

    expect(screen.getByTestId("a-step")).toBeDisabled();
    expect(screen.getByTestId("a-step-lock")).toBeOnTheScreen();
    expect(screen.getByText("Read")).toHaveStyle({ color: colors.textMuted });
  });
});
