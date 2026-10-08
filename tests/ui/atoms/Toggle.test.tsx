import { render, screen, fireEvent } from "@tests/helpers/render";

import { lightTheme } from "@/theme/tokens";
import { Toggle } from "@/ui/atoms/Toggle";

function toggle(props: Partial<Parameters<typeof Toggle>[0]> = {}) {
  const onValueChange = jest.fn<void, [boolean]>();
  render(
    <Toggle
      testID="a-toggle"
      accessibilityLabel="Daily study reminder"
      value={false}
      onValueChange={onValueChange}
      {...props}
    />,
  );
  return onValueChange;
}

describe("Toggle", () => {
  it("is a switch, named by its label, saying whether it's on", () => {
    toggle({ value: true });

    const control = screen.getByTestId("a-toggle");
    expect(control).toHaveProp("accessibilityRole", "switch");
    expect(control).toHaveAccessibleName("Daily study reminder");
    expect(control).toHaveProp("accessibilityState", { checked: true, disabled: false });
  });

  it("turns on when pressed while off", () => {
    const onValueChange = toggle({ value: false });

    fireEvent.press(screen.getByTestId("a-toggle"));

    expect(onValueChange).toHaveBeenCalledWith(true);
  });

  it("turns off when pressed while on", () => {
    const onValueChange = toggle({ value: true });

    fireEvent.press(screen.getByTestId("a-toggle"));

    expect(onValueChange).toHaveBeenCalledWith(false);
  });

  it("ignores a press while disabled", () => {
    const onValueChange = toggle({ disabled: true });

    fireEvent.press(screen.getByTestId("a-toggle"));

    expect(onValueChange).not.toHaveBeenCalled();
    expect(screen.getByTestId("a-toggle")).toHaveProp("accessibilityState", {
      checked: false,
      disabled: true,
    });
  });

  it("fills its track in the accent when on, as every chosen thing is", () => {
    toggle({ value: true });

    expect(screen.getByTestId("a-toggle-fill")).toHaveStyle({
      backgroundColor: lightTheme.colors.accent,
      opacity: 1,
    });
  });

  it("leaves its track quiet when off", () => {
    toggle({ value: false });

    expect(screen.getByTestId("a-toggle-track")).toHaveStyle({
      backgroundColor: lightTheme.colors.divider,
    });
    expect(screen.getByTestId("a-toggle-fill")).toHaveStyle({ opacity: 0 });
  });

  it("is a full tap target", () => {
    toggle();

    const { hitSlop } = screen.getByTestId("a-toggle").props as {
      hitSlop: { top: number; bottom: number };
    };
    // 31pt of track and its slop make the 44pt tap target.
    expect(31 + hitSlop.top + hitSlop.bottom).toBe(44);
  });
});
