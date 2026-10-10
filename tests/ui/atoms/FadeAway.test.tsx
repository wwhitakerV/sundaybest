import { render, screen } from "@tests/helpers/render";
import { View } from "react-native";

import { FadeAway } from "@/ui/atoms/FadeAway";

describe("FadeAway", () => {
  it("shows what's in it", () => {
    render(
      <FadeAway testID="away" hidden={false}>
        <View testID="inside" />
      </FadeAway>,
    );

    expect(screen.getByTestId("away")).toHaveStyle({ opacity: 1 });
    expect(screen.getByTestId("inside")).toBeOnTheScreen();
  });

  it("is faded out while hidden", () => {
    render(
      <FadeAway testID="away" hidden>
        <View />
      </FadeAway>,
    );

    expect(screen.getByTestId("away", { includeHiddenElements: true })).toHaveStyle({
      opacity: 0,
    });
  });

  it("never takes touches", () => {
    render(
      <FadeAway testID="away" hidden={false}>
        <View />
      </FadeAway>,
    );

    expect(screen.getByTestId("away")).toHaveProp("pointerEvents", "none");
  });
});
