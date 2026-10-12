import { render, screen, fireEvent } from "@tests/helpers/render";

import { QuickCheckToggle } from "@/features/plan-creation/components/QuickCheckToggle";

describe("QuickCheckToggle", () => {
  it("offers the Quick Check as the app's own toggle, on or off", () => {
    render(<QuickCheckToggle testID="a-toggle" value onChange={() => undefined} />);

    expect(screen.getByText("Add a quick check quiz")).toBeVisible();
    expect(screen.getByTestId("a-toggle")).toHaveProp("accessibilityRole", "switch");
    expect(screen.getByTestId("a-toggle")).toHaveProp("accessibilityState", {
      checked: true,
      disabled: false,
    });
  });

  it("sits on a list card, as a row: 24 corners", () => {
    render(<QuickCheckToggle testID="a-toggle" value onChange={() => undefined} />);

    expect(screen.getByTestId("a-toggle-card")).toHaveStyle({ borderRadius: 24 });
  });

  it("turns the Quick Check off when pressed while on", () => {
    const onChange = jest.fn<void, [boolean]>();
    render(<QuickCheckToggle testID="a-toggle" value onChange={onChange} />);

    fireEvent.press(screen.getByTestId("a-toggle"));

    expect(onChange).toHaveBeenCalledWith(false);
  });
});
