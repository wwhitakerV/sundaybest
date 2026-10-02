import { render, screen, fireEvent } from "@tests/helpers/render";

import * as haptics from "@/core/haptics/haptics";
import { PlanList } from "@/features/home/components/PlanList";

jest.mock("@/core/haptics/haptics", () => ({
  tapFeedback: jest.fn(),
  selectionFeedback: jest.fn(),
  successFeedback: jest.fn(),
  warningFeedback: jest.fn(),
  errorFeedback: jest.fn(),
}));

describe("PlanList filter haptics", () => {
  it("selects once when another filter is picked", () => {
    render(<PlanList onOpenPlan={jest.fn()} />);

    fireEvent.press(screen.getByTestId("home-tab-plan-filters-option-Done"));

    expect(haptics.selectionFeedback).toHaveBeenCalledTimes(1);
    expect(haptics.tapFeedback).not.toHaveBeenCalled();
  });

  it("is silent when the current filter is picked again", () => {
    render(<PlanList onOpenPlan={jest.fn()} />);

    fireEvent.press(screen.getByTestId("home-tab-plan-filters-option-All"));

    expect(haptics.selectionFeedback).not.toHaveBeenCalled();
  });
});
