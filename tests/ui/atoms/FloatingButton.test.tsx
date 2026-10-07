import { render, screen, fireEvent } from "@tests/helpers/render";
import { BookOpen } from "lucide-react-native";

import { lightTheme } from "@/theme/tokens";
import { FLOATING_NAV_BAR } from "@/ui/organisms/floatingNavBar";
import { FloatingButton } from "@/ui/atoms/FloatingButton";

describe("FloatingButton", () => {
  it("is a white capsule as tall as a floating bar, named by its label", () => {
    render(<FloatingButton testID="a-button" label="Continue" onPress={() => undefined} />);

    const button = screen.getByTestId("a-button");
    expect(button).toHaveStyle({
      height: FLOATING_NAV_BAR.capsuleHeight,
      borderRadius: FLOATING_NAV_BAR.capsuleRadius,
      backgroundColor: lightTheme.colors.background,
    });
    expect(button).toHaveAccessibleName("Continue");
  });

  it("edges a screen's own call to action more heavily than a bar", () => {
    render(<FloatingButton testID="a-button" label="Continue" onPress={() => undefined} />);

    expect(screen.getByTestId("a-button")).toHaveStyle({
      borderColor: lightTheme.colors.borderStrong,
    });
  });

  it("edges a quieter one as lightly as the bar itself", () => {
    render(
      <FloatingButton testID="a-button" label="View results" quiet onPress={() => undefined} />,
    );

    expect(screen.getByTestId("a-button")).toHaveStyle({ borderColor: lightTheme.colors.hairline });
  });

  it("fills black, its label white, as a screen's primary action", () => {
    render(
      <FloatingButton testID="a-button" label="Begin exam" primary onPress={() => undefined} />,
    );

    expect(screen.getByTestId("a-button")).toHaveStyle({
      backgroundColor: lightTheme.colors.controlPrimary,
      borderColor: lightTheme.colors.controlPrimary,
    });
    expect(screen.getByText("Begin exam")).toHaveStyle({
      color: lightTheme.colors.onControlPrimary,
    });
  });

  it("can lead with an icon", () => {
    render(
      <FloatingButton
        testID="a-button"
        label="Continue"
        icon={BookOpen}
        onPress={() => undefined}
      />,
    );

    expect(screen.getByTestId("a-button-icon")).toBeOnTheScreen();
  });

  it("does what it's for when pressed", () => {
    const onPress = jest.fn();
    render(<FloatingButton testID="a-button" label="Continue" onPress={onPress} />);

    fireEvent.press(screen.getByTestId("a-button"));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("can't be pressed, and says so, when there's nowhere to go", () => {
    const onPress = jest.fn();
    render(<FloatingButton testID="a-button" label="Previous" quiet disabled onPress={onPress} />);

    fireEvent.press(screen.getByTestId("a-button"));

    expect(onPress).not.toHaveBeenCalled();
    expect(screen.getByTestId("a-button")).toBeDisabled();
  });

  it("waits, opaque and grey, for a way on that isn't open yet", () => {
    render(
      <FloatingButton testID="a-button" label="Day 3 tomorrow" waiting onPress={() => undefined} />,
    );

    expect(screen.getByTestId("a-button")).toHaveStyle({
      backgroundColor: lightTheme.colors.waitingFill,
    });
    expect(screen.getByText("Day 3 tomorrow")).toHaveStyle({ color: lightTheme.colors.waitingInk });
  });
});
