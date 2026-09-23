import { Text } from "react-native";
import { render, screen } from "@tests/helpers/render";

import { AnimatedTabIcon } from "@/ui/tab-bar/AnimatedTabIcon";

describe("AnimatedTabIcon", () => {
  it("renders the icon it wraps", () => {
    render(
      <AnimatedTabIcon active={false} iconSize={23} burstClearance={20}>
        <Text>icon</Text>
      </AnimatedTabIcon>,
    );

    expect(screen.getByText("icon")).toBeOnTheScreen();
  });

  it("rests unrotated before any activation", () => {
    render(
      <AnimatedTabIcon testID="a-tab-icon" active iconSize={23} burstClearance={20}>
        <Text>icon</Text>
      </AnimatedTabIcon>,
    );

    expect(screen.getByTestId("a-tab-icon")).toHaveStyle({
      transform: [{ perspective: 320 }, { rotateY: "0deg" }],
    });
  });

  it("renders a burst that never takes touches", () => {
    render(
      <AnimatedTabIcon testID="a-tab-icon" active iconSize={23} burstClearance={20}>
        <Text>icon</Text>
      </AnimatedTabIcon>,
    );

    expect(screen.getByTestId("a-tab-icon-burst")).toHaveProp("pointerEvents", "none");
  });
});
