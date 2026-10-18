import { render, screen } from "@tests/helpers/render";
import { View } from "react-native";

import { Arrive } from "@/ui/arrival/Arrive";
import { ArrivalContext, type ArrivalState } from "@/ui/arrival/arrival";
import { motion } from "@/theme";

const { fromY } = motion.arrival;

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
});
