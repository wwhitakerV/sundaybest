import { render, screen, fireEvent } from "@tests/helpers/render";
import { BookOpen } from "lucide-react-native";

import { LinkRow } from "@/ui/LinkRow";

describe("LinkRow", () => {
  it("is a link, named by its label, saying where it goes", () => {
    render(
      <LinkRow
        testID="a-row"
        icon={BookOpen}
        label="Luke 24:25-49"
        accessibilityHint="Opens Luke 24:25-49 in Safari"
        onPress={() => undefined}
      />,
    );

    const row = screen.getByTestId("a-row");
    expect(row).toHaveAccessibleName("Luke 24:25-49");
    expect(row).toHaveProp("accessibilityRole", "link");
    expect(row).toHaveProp("accessibilityHint", "Opens Luke 24:25-49 in Safari");
  });

  it("follows it when pressed", () => {
    const onPress = jest.fn();
    render(
      <LinkRow
        testID="a-row"
        icon={BookOpen}
        label="Luke 24:25-49"
        accessibilityHint="Opens Luke 24:25-49 in Safari"
        onPress={onPress}
      />,
    );

    fireEvent.press(screen.getByTestId("a-row"));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
