import { render, screen, fireEvent } from "@tests/helpers/render";

import {
  QuickCheckHeader,
  type QuickCheckHeaderProps,
} from "@/features/plans/components/QuickCheckHeader";
import { lightTheme } from "@/theme/tokens";

function renderHeader(props: Partial<QuickCheckHeaderProps> = {}) {
  return render(
    <QuickCheckHeader
      testID="a-quick-check-header"
      total={2}
      progress={{ counter: 1, index: 0 }}
      onClose={() => undefined}
      {...props}
    />,
  );
}

describe("QuickCheckHeader", () => {
  it("shows the title", () => {
    renderHeader();

    expect(screen.getByText("Quick check")).toBeVisible();
  });

  it("calls onClose when the close button is pressed", () => {
    const onClose = jest.fn();
    renderHeader({ onClose });

    fireEvent.press(screen.getByTestId("a-quick-check-header-close-button"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("shows the question counter", () => {
    renderHeader({ progress: { counter: 2, index: 1 } });

    expect(screen.getByText("2 of 2")).toBeVisible();
  });

  it("has one tracker segment per question, and none for anything else", () => {
    renderHeader({ total: 2 });

    expect(screen.getByTestId("a-quick-check-header-progress-segment-1")).toBeVisible();
    expect(screen.queryByTestId("a-quick-check-header-progress-segment-2")).toBeNull();
  });

  it("sizes to the quiz: three questions, three segments", () => {
    renderHeader({ total: 3 });

    expect(screen.getByTestId("a-quick-check-header-progress-segment-2")).toBeVisible();
    expect(screen.queryByTestId("a-quick-check-header-progress-segment-3")).toBeNull();
  });

  it("lights the segment of the question on screen", () => {
    renderHeader({ total: 3, progress: { counter: 2, index: 1 } });

    expect(screen.getByTestId("a-quick-check-header-progress-segment-1")).toHaveStyle({
      backgroundColor: lightTheme.colors.accent,
    });
  });
});
