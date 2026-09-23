import { Pressable, StyleSheet, Text, View } from "react-native";
import { ArrowLeft, ArrowRight } from "lucide-react-native";
import Animated from "react-native-reanimated";

import { useTheme } from "@/theme";
import { DotPagination } from "@/ui/DotPagination";
import { FLOATING_NAV_BAR } from "@/ui/floatingNavBar";
import { useStudyNavEntrance } from "../hooks/use-study-nav-entrance";
import { STUDY_STEP_COUNT } from "../logic/study-steps";
import { SparkBurst } from "./SparkBurst";

const { capsuleHeight, capsuleRadius, sideMargin, bottomMargin } = FLOATING_NAV_BAR;

const ARROW_ICON_SIZE = 20;
const ARROW_STROKE_WIDTH = 2;

export type StudyNavProps = {
  step: number;
  onPrevious: () => void;
  onNext: () => void;
  /** Replaces the forward arrow with a trophy + this label on the last step. */
  finishLabel?: string;
  testID?: string;
};

/**
 * The Daily Study bottom pager: Previous, the step dots, and Next (or
 * Finish). Same floating capsule as the main tab bar. Plays its entrance
 * once on mount via `useStudyNavEntrance`.
 */
export function StudyNav({ step, onPrevious, onNext, finishLabel, testID }: StudyNavProps) {
  const theme = useTheme();
  const { entranceStyle, showSparks } = useStudyNavEntrance();

  return (
    <Animated.View
      testID={testID}
      style={[
        styles.wrapper,
        {
          paddingBottom: bottomMargin,
        },
        entranceStyle,
      ]}
    >
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
          style={styles.side}
        >
          <ArrowLeft
            size={ARROW_ICON_SIZE}
            color={theme.colors.chromeIcon}
            strokeWidth={ARROW_STROKE_WIDTH}
          />

          <Text
            style={[
              theme.typography.label,
              {
                color: theme.colors.text,
              },
            ]}
          >
            Previous
          </Text>
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
          style={styles.side}
        >
          <Text
            style={[
              theme.typography.label,
              {
                color: theme.colors.text,
              },
            ]}
          >
            {finishLabel ? "Finish" : "Next"}
          </Text>

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

  capsule: {
    height: capsuleHeight,
    borderRadius: capsuleRadius,
    borderWidth: 1,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    overflow: "visible",
  },

  side: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
});
