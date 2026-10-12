import { StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import { screen } from "@testing-library/react-native";

type PressStyle = (state: { pressed: boolean }) => StyleProp<ViewStyle>;

/**
 * A pressable's style as it'd be drawn pressed (or not). The test renderer
 * never holds a press down, so it's read from whichever element carrying the
 * testID has a style that depends on the press — else the drawn style, which
 * then can't change with it.
 */
export function lookWhenPressed(testID: string, pressed = true): ViewStyle {
  const drawn = screen.getByTestId(testID);
  for (let node = drawn; node.props.testID === testID;) {
    const style: unknown = node.props.style;
    if (typeof style === "function") return StyleSheet.flatten((style as PressStyle)({ pressed }));
    if (!node.parent) break;
    node = node.parent;
  }
  return StyleSheet.flatten(drawn.props.style as StyleProp<ViewStyle>);
}
