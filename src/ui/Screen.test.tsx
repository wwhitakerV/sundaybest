import { Text } from "react-native";

import { render, screen } from "@test/render";

import { Screen } from "./Screen";

describe("Screen", () => {
  it("forwards testID to the outermost view", () => {
    render(
      <Screen testID="a-screen">
        <Text>content</Text>
      </Screen>,
    );

    expect(screen.getByTestId("a-screen")).toBeVisible();
  });

  it("renders its children", () => {
    render(
      <Screen>
        <Text>hello world</Text>
      </Screen>,
    );

    expect(screen.getByText("hello world")).toBeVisible();
  });

  it("applies the themed background colour", () => {
    render(<Screen testID="a-screen" />);

    // Light theme background; useColorScheme returns null under test.
    expect(screen.getByTestId("a-screen")).toHaveStyle({ backgroundColor: "#FFFFFF" });
  });
});
