import { Mail } from "lucide-react-native";
import { fireEvent, render, screen, within } from "@tests/helpers/render";
import Svg from "react-native-svg";
import { Text } from "react-native";

import { lightTheme } from "@/theme/tokens";
import { InputField } from "@/ui/molecules/InputField";

const { colors } = lightTheme;

describe("InputField", () => {
  it("is the shared field frame with its icon, its placeholder in the supporting grey", () => {
    render(
      <InputField
        testID="email"
        icon={Mail}
        value=""
        onChangeText={jest.fn()}
        placeholder="Email"
        accessibilityLabel="Email"
      />,
    );

    expect(screen.getByTestId("email-field")).toHaveStyle({
      minHeight: 52,
      borderColor: colors.containerBorder,
    });
    expect(within(screen.getByTestId("email-field")).UNSAFE_getByType(Svg)).toBeTruthy();
    expect(screen.getByTestId("email").props.placeholderTextColor).toBe(colors.textSupporting);
  });

  it("passes what's typed on", () => {
    const onChangeText = jest.fn();
    render(
      <InputField
        testID="email"
        icon={Mail}
        value=""
        onChangeText={onChangeText}
        placeholder="Email"
        accessibilityLabel="Email"
      />,
    );

    fireEvent.changeText(screen.getByTestId("email"), "me@example.com");

    expect(onChangeText).toHaveBeenCalledWith("me@example.com");
  });

  it("holds a button at its end", () => {
    render(
      <InputField
        testID="link"
        icon={Mail}
        value=""
        onChangeText={jest.fn()}
        placeholder="Link"
        accessibilityLabel="Link"
        end={<Text>Paste</Text>}
      />,
    );

    expect(screen.getByText("Paste")).toBeVisible();
  });

  it("marks what can't be used with an amber edge", () => {
    render(
      <InputField
        testID="link"
        icon={Mail}
        value="nope"
        onChangeText={jest.fn()}
        placeholder="Link"
        accessibilityLabel="Link"
        invalid
      />,
    );

    expect(screen.getByTestId("link-field")).toHaveStyle({ borderColor: colors.incorrect });
  });
});
