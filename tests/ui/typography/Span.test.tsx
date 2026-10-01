import { StyleSheet, type StyleProp, type TextStyle } from "react-native";
import { render, screen } from "@tests/helpers/render";

import { lightTheme } from "@/theme/tokens";
import { SFProBody } from "@/ui/typography/SFProBody";
import { Span } from "@/ui/typography/Span";

/** The style a Span set on itself, flattened — to check what it leaves to its line. */
function ownStyle(testID: string): TextStyle | undefined {
  const style = screen.getByTestId(testID).props.style as StyleProp<TextStyle>;
  return StyleSheet.flatten(style);
}

describe("Span", () => {
  it("sets part of a line in another tone, keeping the line's type", () => {
    render(
      <SFProBody>
        {"Day 2 "}
        <Span testID="a-span" tone="textMuted">
          Read
        </Span>
      </SFProBody>,
    );

    const span = screen.getByTestId("a-span");
    expect(span).toHaveStyle({ color: lightTheme.colors.textMuted });
    // Its type is its line's: it sets no size of its own.
    expect(ownStyle("a-span")?.fontSize).toBeUndefined();
  });

  it("leaves the colour to its line when given no tone", () => {
    render(
      <SFProBody tone="accent">
        <Span testID="a-span">Read</Span>
      </SFProBody>,
    );

    expect(ownStyle("a-span")?.color).toBeUndefined();
  });

  it("can set its words in italic, and take a layout style", () => {
    render(
      <SFProBody>
        <Span testID="a-span" italic style={{ textDecorationLine: "underline" }}>
          ____
        </Span>
      </SFProBody>,
    );

    expect(screen.getByTestId("a-span")).toHaveStyle({
      fontStyle: "italic",
      textDecorationLine: "underline",
    });
  });
});
