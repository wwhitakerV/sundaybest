import { fireEvent, render, screen } from "@tests/helpers/render";

import { NotFoundScreen } from "@/ui/organisms/NotFoundScreen";

function setup(onAction = jest.fn()) {
  render(
    <NotFoundScreen
      testID="missing-screen"
      title="Plan not found"
      message="It may have been removed."
      actionLabel="Back to plans"
      onAction={onAction}
    />,
  );
  return onAction;
}

describe("NotFoundScreen", () => {
  it("renders the root with its testID", () => {
    setup();
    expect(screen.getByTestId("missing-screen")).toBeVisible();
  });

  it("announces the title as a header", () => {
    setup();
    expect(screen.getByRole("header", { name: "Plan not found" })).toBeVisible();
  });

  it("shows the message", () => {
    setup();
    expect(screen.getByText("It may have been removed.")).toBeVisible();
  });

  it("names the action by its label", () => {
    setup();
    expect(screen.getByRole("button", { name: "Back to plans" })).toBeVisible();
    expect(screen.getByTestId("missing-screen-action")).toBeVisible();
  });

  it("calls onAction once when the action is pressed", () => {
    const onAction = setup();
    fireEvent.press(screen.getByTestId("missing-screen-action"));
    expect(onAction).toHaveBeenCalledTimes(1);
  });
});
