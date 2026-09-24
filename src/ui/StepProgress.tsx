import { StyleSheet, View } from "react-native";

import { useTheme, type Theme } from "@/theme";
import { getSegmentFill } from "@/utils/steps/getSegmentFill";
import { getStepState, type StepState } from "@/utils/steps/getStepState";

const SEGMENT_HEIGHT = 3;
const GAP = 4;
/** A page mark: a ring the line's height, white in the middle. */
const DOT_SIZE = SEGMENT_HEIGHT;
const DOT_RING = 0.25;

function segmentColor(state: StepState, theme: Theme): string {
  switch (state) {
    case "completed":
      return theme.palette.black;
    case "active":
      return theme.colors.accent;
    case "upcoming":
      return theme.palette.greyLightest;
  }
}

export type StepProgressProps = {
  /** Total number of steps — 4 for the daily study flow, 3 for Quick Check. */
  steps: number;
  /** 0-indexed. Segments before this are complete; this one is active; after are upcoming. */
  activeIndex: number;
  /** Pages in each step, in order, when a step has more than one. One each if omitted. */
  pages?: readonly number[];
  /** 0-indexed page within the active step. */
  activePage?: number;
  testID?: string;
};

/**
 * The horizontal line tracker under a study or Quick Check header: solid
 * dark for a completed step, accent-coloured for the current one, light
 * grey for what's ahead. Shared by Read/Scripture/Reflect/Pray (4 steps)
 * and Quick Check (3 steps) rather than duplicated per screen.
 *
 * A step with several pages (Reflect's questions) is marked off by a dot
 * where each later page begins — a ring in the segment's colour, white in
 * the middle — and the current one fills in accent only as far as the page
 * the user is on.
 */
export function StepProgress({
  steps,
  activeIndex,
  pages,
  activePage = 0,
  testID,
}: StepProgressProps) {
  const theme = useTheme();

  return (
    <View testID={testID} style={styles.row}>
      {Array.from({ length: steps }, (_, index) => {
        const state = getStepState(index, activeIndex);
        const segmentID = testID && `${testID}-segment-${index}`;
        const pageCount = pages?.at(index) ?? 1;

        if (pageCount <= 1) {
          return (
            <View
              key={index}
              testID={segmentID}
              style={[styles.segment, { backgroundColor: segmentColor(state, theme) }]}
            />
          );
        }

        const { fill, dots } = getSegmentFill(state, pageCount, activePage);
        const fillColor = segmentColor(state === "completed" ? "completed" : "active", theme);
        const trackColor = state === "completed" ? fillColor : segmentColor("upcoming", theme);

        return (
          <View
            key={index}
            testID={segmentID}
            style={[styles.segment, { backgroundColor: trackColor }]}
          >
            {state === "active" && (
              <View
                testID={segmentID && `${segmentID}-fill`}
                style={[styles.fill, { width: `${fill * 100}%`, backgroundColor: fillColor }]}
              />
            )}
            {dots.map((at, dotIndex) => (
              <View
                key={at}
                testID={segmentID && `${segmentID}-dot-${dotIndex + 1}`}
                style={[
                  styles.dot,
                  {
                    left: `${at * 100}%`,
                    borderColor: state === "upcoming" ? trackColor : fillColor,
                    backgroundColor: theme.colors.background,
                  },
                ]}
              />
            ))}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: GAP },
  segment: { flex: 1, height: SEGMENT_HEIGHT, borderRadius: SEGMENT_HEIGHT / 2 },
  fill: { height: SEGMENT_HEIGHT, borderRadius: SEGMENT_HEIGHT / 2 },
  dot: {
    position: "absolute",
    top: (SEGMENT_HEIGHT - DOT_SIZE) / 2,
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    borderWidth: DOT_RING,
    marginLeft: -DOT_SIZE / 2,
  },
});
