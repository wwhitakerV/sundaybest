import { render, screen, fireEvent } from "@tests/helpers/render";
import { Zap } from "lucide-react-native";

import { lightTheme } from "@/theme/tokens";
import { Chip } from "@/ui/Chip";

describe("Chip", () => {
  it("is a 44 pt-tall button named by its label", () => {
    render(
      <Chip
        testID="a-chip"
        label="Streaks"
        icon={Zap}
        selected={false}
        onPress={() => undefined}
      />,
    );

    const chip = screen.getByTestId("a-chip");
    expect(chip).toHaveStyle({ height: 44 });
    expect(chip).toHaveAccessibleName("Streaks");
  });

  it("is white with a hairline border when it isn't picked", () => {
    render(<Chip testID="a-chip" label="Streaks" selected={false} onPress={() => undefined} />);

    expect(screen.getByTestId("a-chip")).toHaveStyle({
      backgroundColor: lightTheme.colors.background,
      borderColor: lightTheme.colors.hairline,
    });
    expect(screen.getByTestId("a-chip")).not.toBeSelected();
  });

  it("fills a soft grey, with a stronger label, when it's picked", () => {
    render(<Chip testID="a-chip" label="Streaks" selected onPress={() => undefined} />);

    expect(screen.getByTestId("a-chip")).toHaveStyle({
      backgroundColor: lightTheme.colors.segmentActiveBackground,
    });
    expect(screen.getByTestId("a-chip")).toBeSelected();
    expect(screen.getByText("Streaks")).toHaveStyle({
      color: lightTheme.colors.text,
      fontWeight: "600",
    });
  });

  it("calls onPress when pressed", () => {
    const onPress = jest.fn();
    render(<Chip testID="a-chip" label="Streaks" selected={false} onPress={onPress} />);

    fireEvent.press(screen.getByTestId("a-chip"));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
