import { render, screen, fireEvent } from "@tests/helpers/render";
import { LayoutGrid } from "lucide-react-native";

import { lightTheme } from "@/theme/tokens";
import { IconSquareButton } from "@/ui/IconSquareButton";

describe("IconSquareButton", () => {
  it("is a 44 pt rounded square, outlined on the page, named for VoiceOver", () => {
    render(
      <IconSquareButton
        testID="a-button"
        icon={LayoutGrid}
        accessibilityLabel="All subjects"
        onPress={() => undefined}
      />,
    );

    const button = screen.getByTestId("a-button");
    expect(button).toHaveStyle({
      width: 44,
      height: 44,
      backgroundColor: lightTheme.colors.background,
      borderColor: lightTheme.colors.border,
    });
    expect(button).toHaveAccessibleName("All subjects");
  });

  it("does what it's for when pressed", () => {
    const onPress = jest.fn();
    render(
      <IconSquareButton
        testID="a-button"
        icon={LayoutGrid}
        accessibilityLabel="All subjects"
        onPress={onPress}
      />,
    );

    fireEvent.press(screen.getByTestId("a-button"));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
