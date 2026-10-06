import { fireEvent, render, screen } from "@tests/helpers/render";

import {
  GenerationBar,
  type GenerationBarProps,
} from "@/features/plan-creation/components/GenerationBar";
import type { GenerationBarView } from "@/features/plan-creation/logic/generation-bar";
import { lightTheme } from "@/theme/tokens";

const building: GenerationBarView = { kind: "building", id: "generation-1", percent: 62, more: 0 };
const ready: GenerationBarView = {
  kind: "ready",
  id: "generation-1",
  planId: "plan-1",
  title: "Break free",
};
const failed: GenerationBarView = {
  kind: "failed",
  id: "generation-1",
  startKey: null,
  reason: "We couldn’t build this plan right now. Please try again.",
  action: "retry",
};

const handlers = {
  onDismiss: jest.fn(),
  onOpen: jest.fn(),
  onExpand: jest.fn(),
  onRetry: jest.fn(),
  onChooseAnother: jest.fn(),
};

function renderBar(view: GenerationBarView, overrides: Partial<GenerationBarProps> = {}) {
  return render(<GenerationBar testID="generation-bar" view={view} {...handlers} {...overrides} />);
}

beforeEach(() => jest.clearAllMocks());

describe("GenerationBar", () => {
  it.each([building, ready, failed])(
    "can always be dismissed, from the X at its start ($kind)",
    (view) => {
      renderBar(view);

      fireEvent.press(screen.getByTestId("generation-bar-dismiss"));

      expect(screen.getByTestId("generation-bar-dismiss")).toHaveAccessibleName("Dismiss");
      expect(handlers.onDismiss).toHaveBeenCalledTimes(1);
    },
  );

  it("is a pill, divided after its X", () => {
    renderBar(building);

    expect(screen.getByTestId("generation-bar")).toHaveStyle({ borderRadius: 999 });
    expect(screen.getByTestId("generation-bar-divider")).toBeOnTheScreen();
  });

  describe("while a plan is being built", () => {
    it("says so, how far along it is, and fills its line that far", () => {
      renderBar(building);

      expect(screen.getByText("Generating plan")).toBeVisible();
      expect(screen.getByText("62%")).toBeVisible();
      expect(screen.getByTestId("generation-bar-progress")).toHaveStyle({
        width: "62%",
        backgroundColor: lightTheme.colors.accent,
      });
    });

    it("is drawn in the primary control's colours", () => {
      renderBar(building);

      expect(screen.getByTestId("generation-bar")).toHaveStyle({
        backgroundColor: lightTheme.colors.controlPrimary,
      });
    });

    it("counts every plan being built", () => {
      renderBar({ ...building, more: 1 });

      expect(screen.getByText("Generating 2 plans")).toBeVisible();
    });

    it("opens the build's steps when tapped", () => {
      renderBar(building);

      fireEvent.press(screen.getByTestId("generation-bar-details"));

      expect(handlers.onExpand).toHaveBeenCalledTimes(1);
    });
  });

  describe("once the plan is ready", () => {
    it("says so in green, with the plan's title", () => {
      renderBar(ready);

      expect(screen.getByText("Your plan is ready")).toBeVisible();
      expect(screen.getByText("Break free")).toBeVisible();
      expect(screen.getByTestId("generation-bar")).toHaveStyle({
        backgroundColor: lightTheme.colors.success,
      });
    });

    it("opens the plan", () => {
      renderBar(ready);

      fireEvent.press(screen.getByTestId("generation-bar-open"));

      expect(handlers.onOpen).toHaveBeenCalledTimes(1);
    });
  });

  describe("when the plan couldn't be built", () => {
    it("says so, with the reason", () => {
      renderBar(failed);

      expect(screen.getByText("Couldn’t build your plan")).toBeVisible();
      expect(screen.getByText(failed.kind === "failed" ? failed.reason : "")).toBeVisible();
    });

    it("tries again", () => {
      renderBar(failed);

      fireEvent.press(screen.getByTestId("generation-bar-retry"));

      expect(handlers.onRetry).toHaveBeenCalledTimes(1);
    });

    it("offers another sermon instead when this one can't be built from", () => {
      renderBar({ ...failed, action: "chooseAnother" });

      fireEvent.press(screen.getByTestId("generation-bar-choose-another"));

      expect(screen.getByText("New sermon")).toBeVisible();
      expect(handlers.onChooseAnother).toHaveBeenCalledTimes(1);
    });
  });
});
