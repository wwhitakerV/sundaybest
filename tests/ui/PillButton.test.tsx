import { render, screen, fireEvent } from "@tests/helpers/render";
import { Info } from "lucide-react-native";

import { lightTheme } from "@/theme/tokens";
import { PillButton } from "@/ui/PillButton";

describe("PillButton", () => {
  it("is a 44 pt pill, outlined in a hairline, named by its label", () => {
    render(
      <PillButton testID="a-pill" icon={Info} label="Topics covered" onPress={() => undefined} />,
    );

    const pill = screen.getByTestId("a-pill");
    expect(pill).toHaveStyle({
      height: 44,
      borderColor: lightTheme.colors.hairline,
      borderRadius: lightTheme.radii.pill,
    });
    expect(pill).toHaveAccessibleName("Topics covered");
  });

  it("does what it's for when pressed", () => {
    const onPress = jest.fn();
    render(<PillButton testID="a-pill" icon={Info} label="Topics covered" onPress={onPress} />);

    fireEvent.press(screen.getByTestId("a-pill"));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
