import { useContext, useState, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";

import Animated, { useAnimatedStyle } from "react-native-reanimated";

import { useKeyboardLift } from "@/hooks/use-keyboard-lift";
import { edgeFade, space } from "@/theme";
import { BottomFade } from "@/ui/atoms/BottomFade";
import { SEARCH_FIELD_HEIGHT } from "@/ui/molecules/SearchField";

/** From the bar's foot: the room a page leaves under its content so nothing ends behind the bar. */
export const KEYBOARD_BAR_ROOM = SEARCH_FIELD_HEIGHT + space[8] * 2;

export type KeyboardBarProps = {
  /** What sits on the keyboard: a search field, and a close beside it if the page has one. */
  children: ReactNode;
  testID?: string;
};

/**
 * A bar that rides the keyboard — 8pt from the screen's edges and above the
 * keys, at the screen's foot once the keyboard's put away — over the page,
 * which runs on beneath it. In the gap below it, the page's edge tint at the
 * edges' peak (`edgeFade.peak`), easing out behind the field and ending at
 * its top: what scrolls under still shows, faintly, never distracting.
 */
export function KeyboardBar({ children, testID }: KeyboardBarProps) {
  const insetBottom = useContext(SafeAreaInsetsContext)?.bottom ?? 0;
  // Clear of the home indicator at rest; on the keyboard, it rises with the keys — their
  // duration and curve, frame by frame — to sit a gap above them.
  const lift = useKeyboardLift();
  const [height, setHeight] = useState(0);
  const rise = useAnimatedStyle(() => ({
    transform: [{ translateY: -Math.max(lift.get() - insetBottom, 0) }],
  }));

  return (
    <Animated.View
      {...(testID && { testID })}
      pointerEvents="box-none"
      onLayout={(event) => setHeight(event.nativeEvent.layout.height)}
      style={[
        styles.bar,
        {
          gap: space[10],
          paddingHorizontal: space[8],
          paddingTop: space[8],
          paddingBottom: insetBottom + space[8],
        },
        rise,
      ]}
    >
      {height > 0 && (
        // Up to the field's top and no higher: at the peak in the gap below it, easing out
        // behind the field itself, where the field covers the ramp.
        <View pointerEvents="none" style={[styles.tint, { height: height - space[8] }]}>
          <BottomFade
            height={height - space[8]}
            solidHeight={height - space[8] - SEARCH_FIELD_HEIGHT}
            peak={edgeFade.peak}
          />
        </View>
      )}
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
  },
  // From the screen's foot up to the field's top.
  tint: { position: "absolute", left: 0, right: 0, bottom: 0 },
});
