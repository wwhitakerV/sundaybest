import { render, screen, fireEvent } from "@tests/helpers/render";

import { PlanCreationHeader } from "@/features/plan-creation/components/PlanCreationHeader";

describe("PlanCreationHeader", () => {
  it("shows the title", () => {
    render(<PlanCreationHeader testID="a-header" leading="close" onPress={() => undefined} />);

    expect(screen.getByText("New plan")).toBeVisible();
  });

  it("shows the step context when given one", () => {
    render(
      <PlanCreationHeader
        testID="a-header"
        leading="close"
        step="1 of 2"
        onPress={() => undefined}
      />,
    );

    expect(screen.getByText("1 of 2")).toBeVisible();
  });

  it("calls onPress when the close button is pressed", () => {
    const onPress = jest.fn();
    render(<PlanCreationHeader testID="a-header" leading="close" onPress={onPress} />);

    fireEvent.press(screen.getByTestId("a-header-close-button"));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("calls onPress when the back button is pressed", () => {
    const onPress = jest.fn();
    render(<PlanCreationHeader testID="a-header" leading="back" onPress={onPress} />);

    fireEvent.press(screen.getByTestId("a-header-back-button"));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
