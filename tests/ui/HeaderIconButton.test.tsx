import { render, screen, fireEvent } from "@tests/helpers/render";
import { X } from "lucide-react-native";

import { HeaderIconButton } from "@/ui/HeaderIconButton";
import { HeaderEntranceContext } from "@/ui/header-entrance";
import { hasHeaderEntrance } from "@tests/helpers/header-entrance";

describe("HeaderIconButton", () => {
  it("forwards testID to the outermost pressable", () => {
    render(
      <HeaderIconButton
        testID="a-header-icon-button"
        icon={X}
        accessibilityLabel="Close"
        onPress={() => undefined}
      />,
    );

    expect(screen.getByTestId("a-header-icon-button")).toBeVisible();
  });

  it("calls onPress when pressed", () => {
    const onPress = jest.fn();
    render(
      <HeaderIconButton
        testID="a-header-icon-button"
        icon={X}
        accessibilityLabel="Close"
        onPress={onPress}
      />,
    );

    fireEvent.press(screen.getByTestId("a-header-icon-button"));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("has an accessibility role of button with the given label", () => {
    render(
      <HeaderIconButton
        testID="a-header-icon-button"
        icon={X}
        accessibilityLabel="Close"
        onPress={() => undefined}
      />,
    );

    expect(screen.getByRole("button", { name: "Close" })).toBeVisible();
  });

  it("is a 49x49 circle", () => {
    render(
      <HeaderIconButton
        testID="a-header-icon-button"
        icon={X}
        accessibilityLabel="Close"
        onPress={() => undefined}
      />,
    );

    expect(screen.getByTestId("a-header-icon-button")).toHaveStyle({
      width: 49,
      height: 49,
      borderRadius: 25,
    });
  });

  it("applies a hairline border and white background", () => {
    render(
      <HeaderIconButton
        testID="a-header-icon-button"
        icon={X}
        accessibilityLabel="Close"
        onPress={() => undefined}
      />,
    );

    expect(screen.getByTestId("a-header-icon-button")).toHaveStyle({
      backgroundColor: "#FFFFFF",
      borderColor: "rgba(0, 0, 0, 0.06)",
      borderWidth: 1,
    });
  });

  it("hides the border when bordered is false", () => {
    render(
      <HeaderIconButton
        testID="a-header-icon-button"
        icon={X}
        accessibilityLabel="Close"
        bordered={false}
        onPress={() => undefined}
      />,
    );

    expect(screen.getByTestId("a-header-icon-button")).toHaveStyle({
      borderColor: "transparent",
    });
  });

  it("arrives with its entrance by default", () => {
    render(
      <HeaderIconButton
        testID="a-header-icon-button"
        icon={X}
        accessibilityLabel="Close"
        onPress={() => undefined}
      />,
    );

    expect(hasHeaderEntrance("a-header-icon-button")).toBe(true);
  });

  it("is just there, no entrance, when its screen says to hold still", () => {
    render(
      <HeaderEntranceContext.Provider value={{ arrivals: 1, animate: false }}>
        <HeaderIconButton
          testID="a-header-icon-button"
          icon={X}
          accessibilityLabel="Close"
          onPress={() => undefined}
        />
      </HeaderEntranceContext.Provider>,
    );

    expect(hasHeaderEntrance("a-header-icon-button")).toBe(false);
  });

  it("comes in afresh each time its screen is arrived at", () => {
    const button = (arrivals: number) => (
      <HeaderEntranceContext.Provider value={{ arrivals, animate: true }}>
        <HeaderIconButton
          testID="a-header-icon-button"
          icon={X}
          accessibilityLabel="Close"
          onPress={() => undefined}
        />
      </HeaderEntranceContext.Provider>
    );
    const view = render(button(1));
    const first = screen.getByTestId("a-header-icon-button");

    view.rerender(button(2));

    expect(screen.getByTestId("a-header-icon-button")).not.toBe(first);
  });
});
