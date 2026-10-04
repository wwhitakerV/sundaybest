import { useContext } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { ArrowLeft, ArrowRight } from "lucide-react-native";
import Animated from "react-native-reanimated";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";

import { space, useTheme } from "@/theme";
import { DotPagination } from "./DotPagination";
import { BottomFade } from "@/ui/atoms/BottomFade";
import {
  FLOATING_NAV_BAR,
  getFloatingNavBarBottom,
  getFloatingNavBarTintHeight,
} from "@/ui/organisms/floatingNavBar";
import { useStudyNavEntrance } from "../hooks/use-study-nav-entrance";
import { STUDY_STEP_COUNT } from "../logic/study-steps";
import { SparkBurst } from "./SparkBurst";
import { SFProBody } from "@/ui/typography/SFProBody";

const { capsuleHeight, capsuleRadius, sideMargin } = FLOATING_NAV_BAR;

const ARROW_ICON_SIZE = 20;
const ARROW_STROKE_WIDTH = 2;
/**
 * Both ends of the bar are this wide, whatever they say — "Previous", "Next",
 * "Finish" — so the dots stay centred and nothing shifts as a label changes.
 * Fits the longest, "Previous", with its arrow.
 */
const SIDE_WIDTH = 96;

export type StudyNavProps = {
  step: number;
  onPrevious: () => void;
  onNext: () => void;
  /** Replaces the forward arrow with a trophy + this label on the last step. */
  finishLabel?: string;
  disabled?: boolean;
  testID?: string;
};

/**
 * The Daily Study bottom pager: Previous, the step dots, and Next (or
 * Finish). Same floating capsule as the main tab bar. Plays its entrance
 * once on mount via `useStudyNavEntrance`.
 */
export function StudyNav({
  step,
  onPrevious,
  onNext,
  finishLabel,
  disabled = false,
  testID,
}: StudyNavProps) {
  const theme = useTheme();
  const { entranceStyle, showSparks } = useStudyNavEntrance();
  const insetBottom = useContext(SafeAreaInsetsContext)?.bottom ?? 0;
  const capsuleBottom = getFloatingNavBarBottom(insetBottom);
  const tintHeight = getFloatingNavBarTintHeight(capsuleBottom);

  return (
    <Animated.View
      testID={testID}
      style={[
        styles.wrapper,
        // Placed inside `Screen`, whose content already ends at the safe
        // area's edge — so measured from there, to land where the tab bar does.
        { bottom: capsuleBottom - insetBottom },
        entranceStyle,
      ]}
    >
      {/* Behind it, edge to edge and down to the screen's edge: hides what
      scrolls under the bar — solid below the capsule, fading out a little above it. */}
      <View
        pointerEvents="none"
        style={[styles.tint, { bottom: -capsuleBottom, height: tintHeight }]}
      >
        <BottomFade
          {...(testID && { testID: `${testID}-tint` })}
          height={tintHeight}
          solidHeight={capsuleBottom}
        />
      </View>
      <View
        style={[
          styles.capsule,
          {
            backgroundColor: theme.colors.background,
            borderColor: theme.colors.hairline,
          },
        ]}
      >
        <SparkBurst
          fire={showSparks}
          {...(testID
            ? {
                testID: `${testID}-sparks`,
              }
            : {})}
        />

        <Pressable
          testID={testID ? `${testID}-prev-button` : undefined}
          accessibilityRole="button"
          accessibilityLabel="Previous"
          onPress={onPrevious}
          disabled={disabled}
          style={[styles.side, styles.sideStart, disabled && styles.disabled]}
        >
          <ArrowLeft
            size={ARROW_ICON_SIZE}
            color={theme.colors.chromeIcon}
            strokeWidth={ARROW_STROKE_WIDTH}
          />

          <SFProBody variant="label">Previous</SFProBody>
        </Pressable>

        <DotPagination
          count={STUDY_STEP_COUNT}
          activeIndex={step}
          variant="pill"
          {...(testID
            ? {
                testID: `${testID}-dots`,
              }
            : {})}
        />

        <Pressable
          testID={testID ? `${testID}-next-button` : undefined}
          accessibilityRole="button"
          accessibilityLabel={finishLabel ?? "Next"}
          onPress={onNext}
          disabled={disabled}
          style={[styles.side, styles.sideEnd, disabled && styles.disabled]}
        >
          <SFProBody variant="label">{finishLabel ? "Finish" : "Next"}</SFProBody>

          <ArrowRight
            size={ARROW_ICON_SIZE}
            color={theme.colors.chromeIcon}
            strokeWidth={ARROW_STROKE_WIDTH}
          />
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: sideMargin,
    right: sideMargin,
    bottom: 0,
  },

  tint: { position: "absolute", left: -sideMargin, right: -sideMargin },

  capsule: {
    height: capsuleHeight,
    borderRadius: capsuleRadius,
    borderWidth: 1,
    paddingHorizontal: space[16],
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    overflow: "visible",
  },

  side: {
    width: SIDE_WIDTH,
    flexDirection: "row",
    alignItems: "center",
    gap: space[6],
  },
  sideStart: { justifyContent: "flex-start" },
  sideEnd: { justifyContent: "flex-end" },
  disabled: { opacity: 0.45 },
});
