import { Text } from "react-native";

import { render, screen } from "@tests/helpers/render";

import { PAGE_INSET, Screen } from "@/ui/Screen";

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

  it("applies the standard page inset and section gap when padded", () => {
    render(
      <Screen testID="a-screen" padded>
        <Text>content</Text>
      </Screen>,
    );

    expect(screen.getByText("content").parent?.parent).toHaveStyle({
      paddingHorizontal: PAGE_INSET,
      paddingTop: 12,
      gap: 16,
    });
  });

  it("keeps the top inset and gap but not the side inset when padded vertically", () => {
    render(
      <Screen testID="a-screen" padded="vertical">
        <Text>content</Text>
      </Screen>,
    );

    const content = screen.getByText("content").parent?.parent;
    expect(content).toHaveStyle({ paddingTop: 12, gap: 16 });
    expect(content).not.toHaveStyle({ paddingHorizontal: 24 });
  });

  it("applies the themed background colour", () => {
    render(<Screen testID="a-screen" />);

    // Light theme background; useColorScheme returns null under test.
    expect(screen.getByTestId("a-screen")).toHaveStyle({ backgroundColor: "#FFFFFF" });
  });
});
