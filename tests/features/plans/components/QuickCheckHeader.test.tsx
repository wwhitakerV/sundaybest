import { render, screen, fireEvent } from "@tests/helpers/render";

import { QuickCheckHeader } from "@/features/plans/components/QuickCheckHeader";

describe("QuickCheckHeader", () => {
  it("shows the title", () => {
    render(<QuickCheckHeader testID="a-quick-check-header" step={1} onClose={() => undefined} />);

    expect(screen.getByText("Quick check")).toBeVisible();
  });

  it("calls onClose when the close button is pressed", () => {
    const onClose = jest.fn();
    render(<QuickCheckHeader testID="a-quick-check-header" step={1} onClose={onClose} />);

    fireEvent.press(screen.getByTestId("a-quick-check-header-close-button"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("shows a 3-segment step tracker at the given step", () => {
    render(<QuickCheckHeader testID="a-quick-check-header" step={2} onClose={() => undefined} />);

    expect(screen.getByTestId("a-quick-check-header-progress-segment-0")).toBeVisible();
    expect(screen.getByTestId("a-quick-check-header-progress-segment-2")).toBeVisible();
    expect(screen.queryByTestId("a-quick-check-header-progress-segment-3")).toBeNull();
  });
});
