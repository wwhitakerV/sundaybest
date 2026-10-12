import { render, screen, fireEvent } from "@tests/helpers/render";
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

  it("is a content card by default: the soft fill, a card's edge, 28 corners and 20 inside", () => {
    render(<Card testID="card" />);

    expect(screen.getByTestId("card")).toHaveStyle({
      borderWidth: 1,
      borderRadius: 28,
      padding: 20,
      backgroundColor: colors.surface,
      borderColor: colors.containerBorder,
    });
  });

  it("is a list card of rows: 24 corners, nothing inside, its rows bringing their own", () => {
    render(<Card testID="card" kind="list" />);

    expect(screen.getByTestId("card")).toHaveStyle({ borderRadius: 24, padding: 0 });
  });

  it("is a page's feature card: 32 corners and 24 inside", () => {
    render(<Card testID="card" kind="feature" />);

    expect(screen.getByTestId("card")).toHaveStyle({ borderRadius: 32, padding: 24 });
  });

  it("leaves the room inside to what's in it when it's not inset (a picture to its edges)", () => {
    render(<Card testID="card" kind="feature" inset={false} />);

    expect(screen.getByTestId("card")).toHaveStyle({ borderRadius: 32 });
    expect(screen.getByTestId("card")).not.toHaveStyle({ padding: 24 });
  });

  it("keeps the container border when filled with the page colour", () => {
    render(<Card testID="card" fill="page" />);

    expect(screen.getByTestId("card")).toHaveStyle({ borderColor: colors.containerBorder });
  });

  it("fills with the page colour when asked", () => {
    render(<Card testID="card" fill="page" />);

    expect(screen.getByTestId("card")).toHaveStyle({ backgroundColor: colors.background });
  });

  it("applies the layout it is given alongside its own look", () => {
    render(<Card testID="card" style={{ gap: 16, flexDirection: "row" }} />);

    expect(screen.getByTestId("card")).toHaveStyle({
      gap: 16,
      flexDirection: "row",
      borderWidth: 1,
    });
  });

  it("forwards other View props", () => {
    render(<Card testID="card" accessibilityRole="radiogroup" />);

    expect(screen.getByTestId("card")).toHaveProp("accessibilityRole", "radiogroup");
  });

  describe("tappable", () => {
    it("calls onPress when pressed", () => {
      const onPress = jest.fn();
      render(<Card testID="card" onPress={onPress} accessibilityLabel="A plan" />);

      fireEvent.press(screen.getByTestId("card"));

      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it("is a button, named by its label", () => {
      render(<Card testID="card" onPress={() => undefined} accessibilityLabel="A plan" />);

      expect(screen.getByRole("button", { name: "A plan" })).toBeOnTheScreen();
    });

    it("keeps its shell's edge and fill", () => {
      render(<Card testID="card" onPress={() => undefined} accessibilityLabel="A plan" />);

      expect(screen.getByTestId("card")).toHaveStyle({
        borderColor: colors.containerBorder,
        backgroundColor: colors.surface,
      });
    });
  });

  it("draws no edge when asked for none", () => {
    render(<Card testID="card" edge={false} />);

    expect(screen.getByTestId("card")).toHaveStyle({ borderWidth: 0 });
  });
});
