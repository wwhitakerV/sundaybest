import { StyleSheet } from "react-native";
import { Search, X } from "lucide-react-native";
import { render, screen } from "@tests/helpers/render";

import { HeaderButtonPill } from "@/ui/molecules/HeaderButtonPill";

function renderPill(gone: boolean) {
  render(
    <HeaderButtonPill
      testID="pill"
      gone={gone}
      buttons={[
        {
          key: "search",
          testID: "pill-search",
          icon: Search,
          accessibilityLabel: "Search",
          onPress: jest.fn(),
          sunk: gone,
        },
        { key: "close", icon: X, accessibilityLabel: "Close", onPress: jest.fn() },
      ]}
    />,
  );
}

describe("HeaderButtonPill", () => {
  it("steps away whole when it's gone: nothing in it to tap, hidden from VoiceOver", () => {
    renderPill(true);

    const pill = screen.getByTestId("pill-shell", { includeHiddenElements: true });
    expect(pill).toHaveProp("pointerEvents", "none");
    expect(pill).toHaveProp("accessibilityElementsHidden", true);
  });

  it("is there to tap when it isn't", () => {
    renderPill(false);

    expect(screen.getByTestId("pill-shell")).toHaveProp("pointerEvents", "auto");
    expect(screen.getByRole("button", { name: "Close" })).toBeOnTheScreen();
  });

  it("only fades as it goes: nothing in it changes size", () => {
    renderPill(true);

    // An icon is drawn once, as a picture: scaled, or clipped narrower, it blurs as it comes back.
    for (const testID of ["pill-shell", "pill-search-slot"]) {
      const style: unknown = StyleSheet.flatten(
        screen.getByTestId(testID, { includeHiddenElements: true }).props.style,
      );
      expect(style).toMatchObject({ opacity: 0 });
      expect(style).not.toHaveProperty("transform");
      expect(style).not.toHaveProperty("width");
    }
  });
});
