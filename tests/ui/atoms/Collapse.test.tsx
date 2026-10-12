import { fireEvent, render, screen } from "@tests/helpers/render";
import { View } from "react-native";

import { Collapse } from "@/ui/atoms/Collapse";

const CONTENT_HEIGHT = 120;

function collapse(open: boolean) {
  render(
    <Collapse testID="part" open={open}>
      <View style={{ height: CONTENT_HEIGHT }} />
    </Collapse>,
  );
}

function measure() {
  fireEvent(screen.getByTestId("part-content"), "layout", {
    nativeEvent: { layout: { x: 0, y: 0, width: 300, height: CONTENT_HEIGHT } },
  });
}

describe("Collapse", () => {
  it("is as tall as what's in it from its first frame, before it's been measured, so what's below never jumps", () => {
    collapse(true);

    expect(screen.getByTestId("part")).not.toHaveStyle({ height: 0 });
    expect(screen.getByTestId("part-content")).not.toHaveStyle({ position: "absolute" });
  });

  it("takes no room while rolled up", () => {
    collapse(false);

    // Rolled up, it's hidden from VoiceOver too.
    expect(screen.getByTestId("part", { includeHiddenElements: true })).toHaveStyle({ height: 0 });
  });

  // (The measured height itself lives in a shared value on the UI thread, which Reanimated's
  // Jest mock doesn't keep across renders, so it isn't asserted here.)
  it("lays its content out apart from the box once measured, so a roll can never squeeze it", () => {
    collapse(true);

    measure();

    expect(screen.getByTestId("part-content")).toHaveStyle({ position: "absolute" });
  });
});
