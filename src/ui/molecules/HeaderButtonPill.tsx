import { useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
} from "react-native-reanimated";
import type { LucideIcon } from "lucide-react-native";

import { controlHeight, motion, radius, useTheme } from "@/theme";
import { headerButtonEntrance } from "../header-entrance/header-button-entrance";
import { useHeaderEntrance } from "../header-entrance/header-entrance";
import { useHeaderSide } from "../header-entrance/header-side";

/** As tall as a header's round button. */
const HEIGHT = controlHeight.headerButton;
const BORDER = 1;
/** The room either side of the icons, inside the edge. */
const INSET = 3;
/** One icon's height in the pill. */
const SLOT = HEIGHT - BORDER * 2 - INSET * 2;
/** One icon's width beside another: a little wider than tall, so each tap has room. */
const SLOT_WIDTH = SLOT + 6;
/** The header buttons' icon size. */
const ICON = 23;
/** Its slop up to a full tap target, above and below. */
const SLOP = (controlHeight.hitTarget - SLOT) / 2;
/** The whole pill goes this long after it's asked to: a faded button well on its way out first. */
const GONE_AFTER_MS = 150;
/** The app's one spring, both ways — fading out and back. */
const SPRING = { ...motion.slide, reduceMotion: ReduceMotion.System } as const;

export type HeaderPillButton = {
  key: string;
  icon: LucideIcon;
  accessibilityLabel: string;
  onPress: () => void;
  /** Gone for now: it fades out where it is, and back. */
  sunk?: boolean;
  testID?: string;
};

export type HeaderButtonPillProps = {
  buttons: readonly HeaderPillButton[];
  /**
   * The whole pill gone — just after any button sunk with it — while
   * something else stands in for it (a search on the keyboard, with its own
   * close); back, it fades in again with its buttons.
   */
  gone?: boolean;
  testID?: string;
};

/**
 * Two header buttons side by side, in one pill — as iOS groups a toolbar's,
 * without its glass: the header button's white and hairline edge round both
 * icons. A button sunk fades out where it is, and back; nothing in the pill
 * ever changes size — an icon is drawn once, as a picture, and scaled it
 * blurs. Arrives with its screen, as a header button does.
 */
export function HeaderButtonPill({ buttons, gone = false, testID }: HeaderButtonPillProps) {
  const theme = useTheme();
  const side = useHeaderSide();
  const { arrivals, animate } = useHeaderEntrance();
  // The pill itself going and coming: fading, just after a button sunk with it.
  const away = useSharedValue(gone ? 1 : 0);
  useEffect(() => {
    away.set(gone ? withDelay(GONE_AFTER_MS, withSpring(1, SPRING)) : withSpring(0, SPRING));
  }, [gone, away]);
  const goneStyle = useAnimatedStyle(() => ({ opacity: shown(away.get()) }));

  return (
    // A new key is a new view: it comes in afresh, with its entrance or without.
    <Animated.View key={arrivals} {...(animate && { entering: headerButtonEntrance(side) })}>
      <Animated.View
        {...(testID && { testID: `${testID}-shell` })}
        pointerEvents={gone ? "none" : "auto"}
        accessibilityElementsHidden={gone}
        style={goneStyle}
      >
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
            <PillButton key={key} {...button} />
          ))}
        </View>
      </Animated.View>
    </Animated.View>
  );
}

/** How much shows, `away` 0 (there) to 1 (gone): kept within its ends as the spring settles. */
function shown(away: number): number {
  "worklet";
  return 1 - Math.min(Math.max(away, 0), 1);
}

/** One icon in the pill, in its place: sunk, it fades out there, and back. */
function PillButton({
  icon: Icon,
  accessibilityLabel,
  onPress,
  sunk = false,
  testID,
}: Omit<HeaderPillButton, "key">) {
  const theme = useTheme();
  const depth = useSharedValue(sunk ? 1 : 0);

  useEffect(() => {
    depth.set(withSpring(sunk ? 1 : 0, SPRING));
  }, [sunk, depth]);

  const style = useAnimatedStyle(() => ({ opacity: shown(depth.get()) }));

  return (
    <Animated.View
      {...(testID && { testID: `${testID}-slot` })}
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
  slot: { height: SLOT, alignItems: "center", justifyContent: "center" },
  press: { width: SLOT_WIDTH, height: SLOT, alignItems: "center", justifyContent: "center" },
});
