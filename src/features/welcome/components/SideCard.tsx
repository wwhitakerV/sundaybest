import { memo, type ComponentType } from "react";
import { StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";

import { useFanTilt } from "../hooks/use-fan-tilt";
import {
  BUILD_HEIGHT,
  BUILD_RADIUS,
  BUILD_WIDTH,
  PIVOT_DISTANCE,
  REST_SCALE,
  TOP_PAD,
} from "./fan-geometry";
import type { MockScreenProps } from "./mocks/mock-page";
import { PhoneCardBody } from "./PhoneCardBody";

export type SideCardProps = {
  /** The screen it shows, finished, at `step`. */
  Mock: ComponentType<MockScreenProps>;
  step: number;
  /** Its place in the hand, counting from the left: sets when it fans out and folds in. */
  index: number;
  /** Its tilt about the fan's pivot, below it, when fanned; negative leans left. */
  angleDeg: number;
  /** Fanned out, or folded upright behind the big phone. */
  fanned: boolean;
  testID?: string;
};

/**
 * One of the small, dimmed phones fanned behind the big one. Decoration: its
 * screen shows finished, and it only ever swings — out from behind the big
 * phone and back — never scaling, so it stays sharp. Two nested views keep
 * the tilt (about the fan's pivot) and the shrink (about the card's top) apart.
 */
export const SideCard = memo(function SideCard({
  Mock,
  step,
  index,
  angleDeg,
  fanned,
  testID,
}: SideCardProps) {
  const tiltStyle = useFanTilt(index, angleDeg, fanned);

  return (
    <Animated.View testID={testID} style={[styles.slot, tiltStyle]}>
      <View style={styles.shrink}>
        <PhoneCardBody>
          <Mock step={step} elapsedMs={Infinity} />
        </PhoneCardBody>
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  slot: {
    position: "absolute",
    top: TOP_PAD,
    left: "50%",
    marginLeft: -BUILD_WIDTH / 2,
    width: BUILD_WIDTH,
    height: BUILD_HEIGHT,
    // Tilting about a point well below the card fans the tops apart while
    // the (hidden) bottoms stay gathered — how a hand of cards spreads.
    transformOrigin: [BUILD_WIDTH / 2, PIVOT_DISTANCE, 0],
  },
  shrink: {
    ...StyleSheet.absoluteFill,
    borderRadius: BUILD_RADIUS,
    transform: [{ scale: REST_SCALE }],
    // Shrunk from the top centre, so its top lines up with the big phone's.
    transformOrigin: "50% 0%",
  },
});
