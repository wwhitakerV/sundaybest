import { Text } from "react-native";
import { render, screen } from "@tests/helpers/render";

import { DriftIn } from "@/ui/DriftIn";

describe("DriftIn", () => {
  it("shows what it holds", () => {
    render(
      <DriftIn testID="a-line" revealKey={0} order={0}>
        <Text>Day 2 Read</Text>
      </DriftIn>,
    );

    expect(screen.getByText("Day 2 Read")).toBeOnTheScreen();
  });

  it("is simply in place on its first showing — nothing moves as a screen arrives", () => {
    render(
      <DriftIn testID="a-line" revealKey={0} order={0}>
        <Text>Day 2 Read</Text>
      </DriftIn>,
    );

    expect(screen.getByTestId("a-line")).toHaveStyle({
      opacity: 1,
      transform: [{ translateX: 0 }, { translateY: 0 }],
    });
  });

  it("is in place at once with motion reduced", () => {
    render(
      <DriftIn testID="a-line" revealKey={0} order={0} still>
        <Text>Day 2 Read</Text>
      </DriftIn>,
    );

    expect(screen.getByTestId("a-line")).toHaveStyle({
      opacity: 1,
      transform: [{ translateX: 0 }, { translateY: 0 }],
    });
  });
});
