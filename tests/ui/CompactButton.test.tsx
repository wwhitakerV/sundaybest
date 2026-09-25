import { render, screen, fireEvent } from "@tests/helpers/render";
import { Play } from "lucide-react-native";

import { CompactButton } from "@/ui/CompactButton";

describe("CompactButton", () => {
  it("shows its label, and is named by it", () => {
    render(
      <CompactButton
        testID="a-compact"
        label="Continue Day 2"
        tone="light"
        onPress={() => undefined}
      />,
    );

    expect(screen.getByText("Continue Day 2")).toBeVisible();
    expect(screen.getByTestId("a-compact")).toHaveAccessibleName("Continue Day 2");
  });

  it("is white with dark words on a dark colour", () => {
    render(
      <CompactButton
        testID="a-compact"
        label="Go"
        icon={Play}
        tone="light"
        onPress={() => undefined}
      />,
    );

    expect(screen.getByTestId("a-compact")).toHaveStyle({ backgroundColor: "#FFFFFF" });
    expect(screen.getByText("Go")).toHaveStyle({ color: "#08090A" });
  });

  it("is black with white words on a light colour", () => {
    render(<CompactButton testID="a-compact" label="Go" tone="dark" onPress={() => undefined} />);

    expect(screen.getByTestId("a-compact")).toHaveStyle({ backgroundColor: "#08090A" });
    expect(screen.getByText("Go")).toHaveStyle({ color: "#FFFFFF" });
  });

  it("calls onPress when pressed", () => {
    const onPress = jest.fn();
    render(<CompactButton testID="a-compact" label="Go" tone="light" onPress={onPress} />);

    fireEvent.press(screen.getByTestId("a-compact"));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("can show just its icon, in a circle, still named by its label", () => {
    render(
      <CompactButton
        testID="a-compact"
        label="Continue Day 2"
        icon={Play}
        iconOnly
        tone="light"
        onPress={() => undefined}
      />,
    );

    expect(screen.queryByText("Continue Day 2")).toBeNull();
    expect(screen.getByTestId("a-compact")).toHaveAccessibleName("Continue Day 2");
    expect(screen.getByTestId("a-compact")).toHaveStyle({ width: 44, height: 44 });
  });
});
