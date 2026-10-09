import { useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type SharedValue,
} from "react-native-reanimated";
import type { LucideIcon } from "lucide-react-native";

import { controlHeight, motion, radius, useTheme } from "@/theme";
import { headerButtonEntrance } from "../header-entrance/header-button-entrance";
import { useHeaderEntrance } from "../header-entrance/header-entrance";
import { useHeaderSide } from "../header-entrance/header-side";

/** As tall as a header's round button; with one icon left in it, that round button. */
const HEIGHT = controlHeight.headerButton;
const BORDER = 1;
/** The room either side of the icons, inside the edge. */
const INSET = 3;
/** One icon's height in the pill. */
const SLOT = HEIGHT - BORDER * 2 - INSET * 2;
/** One icon's width beside another: a little wider than tall, so each tap has room. Alone, `SLOT`. */
const SLOT_WIDTH = SLOT + 6;
/** The header buttons' icon size. */
const ICON = 23;
/** Its slop up to a full tap target, above and below. */
const SLOP = (controlHeight.hitTarget - SLOT) / 2;
/** How small an icon gets as it sinks into the page, pushed straight back out of sight. */
const SUNK_SCALE = 0.4;
/** The app's one spring, both ways — sinking, closing up, coming back. */
const SPRING = { ...motion.slide, reduceMotion: ReduceMotion.System } as const;

export type HeaderPillButton = {
  key: string;
  icon: LucideIcon;
  accessibilityLabel: string;
  onPress: () => void;
  /** Gone into the page for now: it sinks away and the pill closes up round the rest. */
  sunk?: boolean;
  testID?: string;
};

export type HeaderButtonPillProps = {
  buttons: readonly HeaderPillButton[];
  testID?: string;
};

/**
 * Two header buttons side by side, in one pill — as iOS groups a toolbar's,
 * without its glass: the header button's white and hairline edge round both
 * icons. A button sunk sinks into the page on a spring — shrinking, fading —
 * and the pill closes up from that side round the rest, which never move;
 * brought back, it springs up again. Arrives with its screen, as a header button does.
 */
export function HeaderButtonPill({ buttons, testID }: HeaderButtonPillProps) {
  const theme = useTheme();
  const side = useHeaderSide();
  const { arrivals, animate } = useHeaderEntrance();
  // A button gone: the rest close up to a lone button's round width, springing as they settle.
  const anySunk = buttons.some((button) => button.sunk);
  const closed = useSharedValue(anySunk ? 1 : 0);
  useEffect(() => {
    closed.set(withSpring(anySunk ? 1 : 0, SPRING));
  }, [anySunk, closed]);

  return (
    // A new key is a new view: it comes in afresh, with its entrance or without.
    <Animated.View key={arrivals} {...(animate && { entering: headerButtonEntrance(side) })}>
      <View
        {...(testID && { testID })}
        style={[
          styles.pill,
          {
            backgroundColor: theme.colors.background,
            borderColor: theme.colors.hairline,
            borderRadius: radius.pill,
          },
        ]}
      >
        {buttons.map(({ key, ...button }) => (
          <PillButton key={key} {...button} closed={closed} />
        ))}
      </View>
    </Animated.View>
  );
}

/**
 * One icon in the pill: its width beside another while both are there, a
 * lone button's once one's gone, none once it's sunk itself.
 */
function PillButton({
  icon: Icon,
  accessibilityLabel,
  onPress,
  sunk = false,
  closed,
  testID,
}: Omit<HeaderPillButton, "key"> & { closed: SharedValue<number> }) {
  const theme = useTheme();
  const depth = useSharedValue(sunk ? 1 : 0);

  useEffect(() => {
    depth.set(withSpring(sunk ? 1 : 0, SPRING));
  }, [sunk, depth]);

  // The spring's give carries the pill's close a touch past round and back — the bounce you
  // see. Its own sinking width and fade are kept within their ends.
  const style = useAnimatedStyle(() => {
    const sunkBy = Math.min(Math.max(depth.get(), 0), 1);
    const width = SLOT + (SLOT_WIDTH - SLOT) * (1 - closed.get());
    return {
      width: Math.max(width * (1 - sunkBy), 0),
      opacity: 1 - sunkBy,
      transform: [{ scale: 1 - (1 - SUNK_SCALE) * depth.get() }],
    };
  });

  return (
    <Animated.View
      style={[styles.slot, style]}
      pointerEvents={sunk ? "none" : "auto"}
      accessibilityElementsHidden={sunk}
    >
      <Pressable
        {...(testID && { testID })}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        hitSlop={{ top: SLOP, bottom: SLOP }}
        onPress={onPress}
        style={styles.press}
      >
        <Icon size={ICON} color={theme.colors.chromeIcon} strokeWidth={theme.icon.strokeWidth} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  pill: {
    height: HEIGHT,
    borderWidth: BORDER,
    paddingHorizontal: INSET,
    flexDirection: "row",
    alignItems: "center",
  },
  // Its icon stays centred in it, whatever its width on the way out.
  slot: { height: SLOT, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  press: { width: SLOT_WIDTH, height: SLOT, alignItems: "center", justifyContent: "center" },
});
