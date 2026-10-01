import { render, screen } from "@tests/helpers/render";
import { Text } from "react-native";

import { lightTheme } from "@/theme/tokens";
import { Card } from "@/ui/atoms/Card";

const { colors } = lightTheme;

describe("Card", () => {
  it("renders its children", () => {
    render(
      <Card testID="card">
        <Text>Inside the card</Text>
      </Card>,
    );

    expect(screen.getByText("Inside the card")).toBeVisible();
  });

  it("forwards its testID", () => {
    render(<Card testID="card" />);

    expect(screen.getByTestId("card")).toBeVisible();
  });

  it("is a surface with a hairline edge and 28 corners by default", () => {
    render(<Card testID="card" />);

    expect(screen.getByTestId("card")).toHaveStyle({
      borderWidth: 1,
      borderRadius: 28,
      backgroundColor: colors.surface,
      borderColor: colors.divider,
    });
  });

  it("takes the corner radius it is given", () => {
    render(<Card testID="card" radius={36} />);

    expect(screen.getByTestId("card")).toHaveStyle({ borderRadius: 36 });
  });

  it("fills with the page colour when asked", () => {
    render(<Card testID="card" fill="page" />);

    expect(screen.getByTestId("card")).toHaveStyle({ backgroundColor: colors.background });
  });

  it("applies the layout it is given alongside its own look", () => {
    render(<Card testID="card" style={{ padding: 22, gap: 16 }} />);

    expect(screen.getByTestId("card")).toHaveStyle({
      padding: 22,
      gap: 16,
      borderWidth: 1,
    });
  });

  it("forwards other View props", () => {
    render(<Card testID="card" accessibilityRole="radiogroup" />);

    expect(screen.getByTestId("card")).toHaveProp("accessibilityRole", "radiogroup");
  });
});
