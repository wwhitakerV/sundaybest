import { Text } from "react-native";
import { render, screen } from "@tests/helpers/render";

import { HeaderEntranceScope } from "@/ui/HeaderEntranceScope";
import { HeaderArrivalContext, useHeaderEntrance, type HeaderArrival } from "@/ui/header-entrance";

function Entrance() {
  const { arrivals, animate } = useHeaderEntrance();
  return <Text testID="entrance">{`${arrivals} ${animate ? "animate" : "still"}`}</Text>;
}

function scopeUnder(arrival: HeaderArrival) {
  return (
    <HeaderArrivalContext.Provider value={arrival}>
      <HeaderEntranceScope routeKey="home-index">
        <Entrance />
      </HeaderEntranceScope>
    </HeaderArrivalContext.Provider>
  );
}

describe("HeaderEntranceScope", () => {
  it("lets its header buttons animate in until told otherwise", () => {
    render(scopeUnder({ routeKey: undefined, count: 0, animate: false }));

    expect(screen.getByTestId("entrance")).toHaveTextContent("0 animate");
  });

  it("brings its header buttons in afresh, animated, when its screen is arrived at that way", () => {
    render(scopeUnder({ routeKey: "home-index", count: 3, animate: true }));

    expect(screen.getByTestId("entrance")).toHaveTextContent("1 animate");
  });

  it("brings them in afresh and still when its screen is switched to from another tab root", () => {
    render(scopeUnder({ routeKey: "home-index", count: 3, animate: false }));

    expect(screen.getByTestId("entrance")).toHaveTextContent("1 still");
  });

  it("holds its header still while other screens are arrived at", () => {
    const view = render(scopeUnder({ routeKey: "home-index", count: 3, animate: false }));

    view.rerender(scopeUnder({ routeKey: "plan", count: 4, animate: true }));

    expect(screen.getByTestId("entrance")).toHaveTextContent("1 still");
  });
});
