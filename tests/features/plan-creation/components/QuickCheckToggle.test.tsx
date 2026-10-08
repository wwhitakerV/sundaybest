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

  it("turns the Quick Check off when pressed while on", () => {
    const onChange = jest.fn<void, [boolean]>();
    render(<QuickCheckToggle testID="a-toggle" value onChange={onChange} />);

    fireEvent.press(screen.getByTestId("a-toggle"));

    expect(onChange).toHaveBeenCalledWith(false);
  });
});
