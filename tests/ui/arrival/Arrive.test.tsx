import { render, screen } from "@tests/helpers/render";
import type { ReactNode } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import { useSharedValue } from "react-native-reanimated";

import { Arrive } from "@/ui/arrival/Arrive";
import {
  ArrivalContext,
  ArrivalLineContext,
  COVERED,
  type ArrivalState,
} from "@/ui/arrival/arrival";
import { motion } from "@/theme";

const { fromY, followPt } = motion.arrival;

/** A cover lifting from the top down, uncovered to `y` (the piece under test sits at the top). */
function Uncovered({ y, children }: { y: number; children: ReactNode }) {
  const line = useSharedValue(y);
  return <ArrivalLineContext.Provider value={line}>{children}</ArrivalLineContext.Provider>;
}

/** A piece that was waiting under a cover that lifts from the top down. */
function arriveUnder(y: number) {
  render(
    <ArrivalContext.Provider value="waiting">
      <Uncovered y={y}>
        <Arrive testID="piece" from="below" order={3}>
          <View />
        </Arrive>
      </Uncovered>
    </ArrivalContext.Provider>,
  );
}

function arrive(from: "above" | "below", state?: ArrivalState) {
  const piece = (
    <Arrive testID="piece" from={from} order={0}>
      <View />
    </Arrive>
  );
  render(state ? <ArrivalContext.Provider value={state}>{piece}</ArrivalContext.Provider> : piece);
}

describe("Arrive", () => {
  it("simply shows, away from a launch", () => {
    arrive("above");

    expect(screen.getByTestId("piece")).toHaveStyle({ opacity: 1, transform: [{ translateY: 0 }] });
  });

  it("waits hidden, just above its place, while the launch still covers the page", () => {
    arrive("above", "waiting");

    expect(screen.getByTestId("piece")).toHaveStyle({
      opacity: 0,
      transform: [{ translateY: -fromY }],
    });
  });

  it("waits just below its place when it's to rise into it", () => {
    arrive("below", "waiting");

    expect(screen.getByTestId("piece")).toHaveStyle({ transform: [{ translateY: fromY }] });
  });

  it("doesn't animate if it arrives after the launch has already revealed the page", () => {
    arrive("below", "arriving");

    expect(screen.getByTestId("piece")).toHaveStyle({ opacity: 1, transform: [{ translateY: 0 }] });
  });

  it("stays hidden while a cover lifting from the top down hasn't reached it", () => {
    arriveUnder(COVERED);

    expect(screen.getByTestId("piece")).toHaveStyle({ opacity: 0 });
  });

  it("comes in as the cover's edge passes it, whatever its place in the cascade", () => {
    arriveUnder(followPt / 2);

    const { opacity } = StyleSheet.flatten(screen.getByTestId("piece").props.style as ViewStyle);
    expect(opacity).toBeGreaterThan(0);
    expect(opacity).toBeLessThan(1);
  });

  it("is all the way in once the cover's edge is well past it", () => {
    arriveUnder(followPt * 2);

    expect(screen.getByTestId("piece")).toHaveStyle({ opacity: 1, transform: [{ translateY: 0 }] });
  });
});
