import { Mail } from "lucide-react-native";
import { render, screen } from "@tests/helpers/render";

import { SettingsField } from "@/features/settings/components/SettingsField";
import { lightTheme } from "@/theme/tokens";

describe("SettingsField", () => {
  it("is the app's one-line field for a single line: 52 tall, a card's edge", () => {
    render(
      <SettingsField
        testID="email"
        label="Email"
        placeholder="Email"
        icon={Mail}
        value=""
        onChangeText={jest.fn()}
      />,
    );

    expect(screen.getByTestId("email-field")).toHaveStyle({
      minHeight: 52,
      borderColor: lightTheme.colors.containerBorder,
    });
    expect(screen.getByLabelText("Email").props.placeholderTextColor).toBe(
      lightTheme.colors.textSupporting,
    );
  });

  it("keeps a message box several lines tall, with its count beneath", () => {
    render(
      <SettingsField
        testID="message"
        label="Message"
        placeholder="What's on your mind?"
        value="Hello"
        onChangeText={jest.fn()}
        multiline
        maxLength={1200}
      />,
    );

    expect(screen.getByText("5/1200")).toBeVisible();
    expect(screen.queryByTestId("message-field")).toBeNull();
    // The app's text box, as every box you write in is.
    expect(screen.getByTestId("message")).toHaveStyle({
      backgroundColor: lightTheme.colors.surface,
      borderColor: lightTheme.colors.containerBorder,
      borderRadius: 24,
    });
  });
});
