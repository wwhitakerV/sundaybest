import { BookOpen } from "lucide-react-native";
import { render, screen, fireEvent } from "@tests/helpers/render";

import { StudyStepRow, type StudyStepRowProps } from "@/features/plans/components/StudyStepRow";
import type { StudyStepLook } from "@/features/plans/logic/day-rail";
import { lightTheme } from "@/theme/tokens";

const { colors, typography } = lightTheme;

function step(status: StudyStepLook["status"]): StudyStepLook {
  return {
    key: "read",
    label: "Read",
    detail: "Grace is received",
    status,
    opens: status !== "locked",
    accessibilityLabel: `Read, ${status}, Grace is received`,
  };
}

function renderRow(overrides: Partial<StudyStepRowProps> = {}) {
  return render(
    <StudyStepRow
      testID="a-step"
      look={step("upcoming")}
      icon={BookOpen}
      joinsPrevious
      joinsNext
      onPress={() => undefined}
      {...overrides}
    />,
  );
}

describe("StudyStepRow", () => {
  it("sets its name firm and clear", () => {
    renderRow();

    expect(screen.getByText("Read")).toHaveStyle(typography.stepTitle);
  });

  it("sets what it holds under its name", () => {
    renderRow();

    expect(screen.getByText("Grace is received")).toHaveStyle(typography.cardDetail);
  });

  describe("the step you're on", () => {
    it("sits on a soft surface — the only row that does", () => {
      renderRow({ look: step("current") });

      expect(screen.getByTestId("a-step")).toHaveStyle({ backgroundColor: colors.surface });
    });

    it("sets its name in full ink", () => {
      renderRow({ look: step("current") });

      expect(screen.getByText("Read")).toHaveStyle({ color: colors.text });
    });

    it("leads the way in with a chevron", () => {
      renderRow({ look: step("current") });

      expect(screen.getByTestId("a-step-chevron")).toBeOnTheScreen();
    });

    it("carries no tag saying it's next", () => {
      renderRow({ look: step("current") });

      expect(screen.queryByText(/next/i)).toBeNull();
    });
  });

  describe("a done step", () => {
    it("recedes: its name muted", () => {
      renderRow({ look: step("done") });

      expect(screen.getByText("Read")).toHaveStyle({ color: colors.textMuted });
    });

    it("recedes: what it held muted too", () => {
      renderRow({ look: step("done") });

      expect(screen.getByText("Grace is received")).toHaveStyle({ color: colors.textMuted });
    });

    it("sits on no surface, with no chevron", () => {
      renderRow({ look: step("done") });

      expect(screen.getByTestId("a-step")).toHaveStyle({ backgroundColor: "transparent" });
      expect(screen.queryByTestId("a-step-chevron")).toBeNull();
    });

    it("opens, to look back on", () => {
      renderRow({ look: step("done") });

      expect(screen.getByTestId("a-step")).not.toBeDisabled();
    });
  });

  describe("a step still to come", () => {
    it("keeps its name neutral — a step behind the one you're on", () => {
      renderRow({ look: step("upcoming") });

      expect(screen.getByText("Read")).toHaveStyle({ color: colors.textInactive });
    });

    it("sits on no surface, with no chevron", () => {
      renderRow({ look: step("upcoming") });

      expect(screen.getByTestId("a-step")).toHaveStyle({ backgroundColor: "transparent" });
      expect(screen.queryByTestId("a-step-chevron")).toBeNull();
    });
  });

  it("joins the step to the one before it", () => {
    renderRow({ joinsPrevious: true });

    expect(screen.getByTestId("a-step-line-in")).toHaveStyle({
      backgroundColor: colors.sequenceLine,
    });
  });

  it("joins the step to the one after it", () => {
    renderRow({ joinsNext: true });

    expect(screen.getByTestId("a-step-line-out")).toHaveStyle({
      backgroundColor: colors.sequenceLine,
    });
  });

  it("runs no line past either end of the sequence", () => {
    renderRow({ joinsPrevious: false, joinsNext: false });

    expect(screen.getByTestId("a-step-line-in")).toHaveStyle({ backgroundColor: "transparent" });
    expect(screen.getByTestId("a-step-line-out")).toHaveStyle({ backgroundColor: "transparent" });
  });

  it("opens the step", () => {
    const onPress = jest.fn();
    renderRow({ onPress });

    fireEvent.press(screen.getByTestId("a-step"));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("won't open a locked day's step", () => {
    renderRow({ look: step("locked") });

    expect(screen.getByTestId("a-step")).toBeDisabled();
  });

  it("mutes a locked day's step", () => {
    renderRow({ look: step("locked") });

    expect(screen.getByText("Read")).toHaveStyle({ color: colors.textMuted });
  });
});
