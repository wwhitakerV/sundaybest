import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { ArrowLeft, ArrowRight } from "lucide-react-native";
import Animated from "react-native-reanimated";

import { space, useTheme } from "@/theme";
import { FLOATING_NAV_BAR } from "@/ui/organisms/floatingNavBar";
import { SFProBody } from "@/ui/typography/SFProBody";
import { useStudyNavEntrance } from "../hooks/use-study-nav-entrance";
import { SparkBurst } from "./SparkBurst";

const { capsuleHeight, capsuleRadius } = FLOATING_NAV_BAR;

const ARROW_ICON_SIZE = 20;
const ARROW_STROKE_WIDTH = 2;
/** "← Previous", the longer label with its arrow. */
const LABEL_WIDTH = 96;
/** Either side of the label, inside the pill. */
const PILL_PADDING = space[20];
/**
 * Both pills are this wide, whatever they say — "Previous", "Next",
 * "Finish" — as wide as "← Previous" with its padding, so nothing shifts as
 * a label changes.
 */
const PILL_WIDTH = LABEL_WIDTH + PILL_PADDING * 2;

export type StudyNavProps = {
  onPrevious: () => void;
  onNext: () => void;
  /** Replaces Next with this label on the last step. */
  finishLabel?: string;
  disabled?: boolean;
  testID?: string;
};

/**
 * The Daily Study pager: Previous and Next (or Finish), two floating pills
 * as tall as the tab bar's, one at each side of the page's dock, which
 * places and tints them (`ScrollFrame`'s `footer`). Each pill is the whole
 * button. Plays its entrance once on mount via `useStudyNavEntrance`.
 */
export function StudyNav({
  onPrevious,
  onNext,
  finishLabel,
  disabled = false,
  testID,
}: StudyNavProps) {
  const theme = useTheme();
  const { entranceStyle, showSparks } = useStudyNavEntrance();
  const arrow = {
    size: ARROW_ICON_SIZE,
    color: theme.colors.chromeIcon,
    strokeWidth: ARROW_STROKE_WIDTH,
  };

  return (
    <Animated.View testID={testID} style={[styles.row, entranceStyle]}>
      <NavPill
        {...(testID && { testID: `${testID}-prev-button` })}
        label="Previous"
        onPress={onPrevious}
        disabled={disabled}
      >
        <ArrowLeft {...arrow} />
        <SFProBody variant="label">Previous</SFProBody>
      </NavPill>

      <NavPill
        {...(testID && { testID: `${testID}-next-button` })}
        label={finishLabel ?? "Next"}
        onPress={onNext}
        disabled={disabled}
        burst={<SparkBurst fire={showSparks} {...(testID && { testID: `${testID}-sparks` })} />}
      >
        <SFProBody variant="label">{finishLabel ? "Finish" : "Next"}</SFProBody>
        <ArrowRight {...arrow} />
      </NavPill>
    </Animated.View>
  );
}

/** One of the pager's pills: the whole pill is the button. */
function NavPill({
  label,
  onPress,
  disabled,
  testID,
  burst,
  children,
}: {
  label: string;
  onPress: () => void;
  disabled: boolean;
  testID?: string;
  /** Drawn over the whole pill: the entrance's spark burst. */
  burst?: ReactNode;
  children: ReactNode;
}) {
  const theme = useTheme();

  return (
    <Pressable
      {...(testID && { testID })}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.pill,
        { backgroundColor: theme.colors.background, borderColor: theme.colors.hairline },
        disabled && styles.disabled,
      ]}
    >
      {burst}
      <View style={styles.face}>{children}</View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "space-between" },
  pill: {
    width: PILL_WIDTH,
    height: capsuleHeight,
    borderRadius: capsuleRadius,
    borderWidth: 1,
    paddingHorizontal: PILL_PADDING,
    justifyContent: "center",
    overflow: "visible",
  },
  face: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: space[6],
  },
  disabled: { opacity: 0.45 },
});
