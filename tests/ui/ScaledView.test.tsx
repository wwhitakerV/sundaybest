import { Text } from "react-native";
import { render, screen } from "@tests/helpers/render";

import { ScaledView } from "@/ui/ScaledView";

describe("ScaledView", () => {
  it("renders its children", () => {
    render(
      <ScaledView designWidth={400} designHeight={800} width={100}>
        <Text>content</Text>
      </ScaledView>,
    );

    expect(screen.getByText("content")).toBeVisible();
  });

  it("takes up the scaled size, keeping the design's proportions", () => {
    render(
      <ScaledView testID="a-scaled" designWidth={400} designHeight={800} width={100}>
        <Text>content</Text>
      </ScaledView>,
    );

    expect(screen.getByTestId("a-scaled")).toHaveStyle({ width: 100, height: 200 });
  });
});
