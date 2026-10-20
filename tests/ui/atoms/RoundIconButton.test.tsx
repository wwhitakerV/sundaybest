import { fireEvent, render, screen } from "@tests/helpers/render";
import { Heart } from "lucide-react-native";

import { RoundIconButton } from "@/ui/atoms/RoundIconButton";
import { lightTheme } from "@/theme/tokens";

const renderButton = (props: Partial<Parameters<typeof RoundIconButton>[0]> = {}) => {
  const onPress = jest.fn();
  render(
    <RoundIconButton
      testID="a-button"
      icon={Heart}
      accessibilityLabel="Like"
      onPress={onPress}
      {...props}
    />,
  );
  return { onPress };
};

describe("RoundIconButton", () => {
  it("is a button, named for what it does", () => {
    renderButton();

    expect(screen.getByRole("button", { name: "Like" })).toBeOnTheScreen();
  });

  it("is the app's round icon button on the page: white, with the page's edge", () => {
    renderButton();

    expect(screen.getByTestId("a-button")).toHaveStyle({
      backgroundColor: lightTheme.colors.background,
      borderColor: lightTheme.colors.containerBorder,
      borderWidth: 1,
    });
  });

  it("does what it's given when pressed", () => {
    const { onPress } = renderButton();

    fireEvent.press(screen.getByTestId("a-button"));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("says it's off until it's on", () => {
    renderButton();

    expect(screen.getByTestId("a-button")).not.toBeSelected();
  });

  it("when on, says so, and fills its icon in the colour it's given", () => {
    renderButton({ on: true, onColor: lightTheme.colors.accent });

    expect(screen.getByTestId("a-button")).toBeSelected();
    // Lucide's icons take no testID through to what they draw: the icon itself says how it's drawn.
    expect(screen.UNSAFE_getByType(Heart).props).toMatchObject({
      fill: lightTheme.colors.accent,
      color: lightTheme.colors.accent,
    });
  });
});
