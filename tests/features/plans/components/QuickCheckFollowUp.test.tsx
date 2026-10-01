import { render, screen, fireEvent } from "@tests/helpers/render";

import {
  QuickCheckFollowUp,
  type QuickCheckFollowUpProps,
} from "@/features/plans/components/QuickCheckFollowUp";
import type { QuickCheckLook } from "@/features/plans/logic/day-rail";
import { lightTheme } from "@/theme/tokens";

const { colors, typography } = lightTheme;

function quickCheck(status: QuickCheckLook["status"], detail: string): QuickCheckLook {
  return {
    key: "quickCheck",
    label: "Quick Check",
    detail,
    status,
    opens: status !== "locked" && status !== "waiting",
    accessibilityLabel: `Quick Check, ${status}, ${detail}`,
  };
}

function renderFollowUp(overrides: Partial<QuickCheckFollowUpProps> = {}) {
  return render(
    <QuickCheckFollowUp
      testID="a-check"
      look={quickCheck("waiting", "After Pray")}
      onPress={() => undefined}
      {...overrides}
    />,
  );
}

describe("QuickCheckFollowUp", () => {
  it("names it in a list row's type, not a study step's", () => {
    renderFollowUp();

    expect(screen.getByText("Quick Check")).toHaveStyle(typography.listItem);
  });

  it("says where it stands, quietly, on the same line", () => {
    renderFollowUp();

    expect(screen.getByText("After Pray")).toHaveStyle({
      ...typography.cardDetail,
      color: colors.textMuted,
    });
  });

  describe("before the day's study is done", () => {
    it("won't open", () => {
      renderFollowUp();

      expect(screen.getByTestId("a-check")).toBeDisabled();
    });

    it("is muted, with no way in", () => {
      renderFollowUp();

      expect(screen.getByText("Quick Check")).toHaveStyle({ color: colors.textMuted });
      expect(screen.queryByTestId("a-check-chevron")).toBeNull();
    });
  });

  describe("once it's open", () => {
    it("leads in with a chevron", () => {
      renderFollowUp({ look: quickCheck("current", "3 questions") });

      expect(screen.getByTestId("a-check-chevron")).toBeOnTheScreen();
    });

    it("sets its name in full ink — neutral, not red", () => {
      renderFollowUp({ look: quickCheck("current", "3 questions") });

      expect(screen.getByText("Quick Check")).toHaveStyle({ color: colors.text });
    });

    it("opens it", () => {
      const onPress = jest.fn();
      renderFollowUp({ look: quickCheck("current", "3 questions"), onPress });

      fireEvent.press(screen.getByTestId("a-check"));

      expect(onPress).toHaveBeenCalledTimes(1);
    });
  });

  describe("once taken", () => {
    it("is ticked, with how it went", () => {
      renderFollowUp({ look: quickCheck("done", "1 of 2 correct") });

      expect(screen.getByTestId("a-check-done")).toBeOnTheScreen();
      expect(screen.getByText("1 of 2 correct")).toBeVisible();
    });

    it("shows the tick in place of a chevron", () => {
      renderFollowUp({ look: quickCheck("done", "1 of 2 correct") });

      expect(screen.queryByTestId("a-check-chevron")).toBeNull();
    });

    it("still opens, to look back on", () => {
      renderFollowUp({ look: quickCheck("done", "1 of 2 correct") });

      expect(screen.getByTestId("a-check")).not.toBeDisabled();
    });
  });

  it("locks a locked day's", () => {
    renderFollowUp({ look: quickCheck("locked", "3 questions") });

    expect(screen.getByTestId("a-check")).toBeDisabled();
    expect(screen.getByTestId("a-check-lock")).toBeOnTheScreen();
  });
});
