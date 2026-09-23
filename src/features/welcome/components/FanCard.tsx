import { memo, useMemo, useRef, type ComponentType } from "react";
import { StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";

import { PHONE_FRAME, PhoneFrame } from "@/ui/PhoneFrame";
import { ScaledView } from "@/ui/ScaledView";
import { useTheme } from "@/theme";
import { useCardPose } from "../hooks/use-card-pose";
import type { DesignRect } from "../logic/lift";
import type { CardPose } from "../logic/story";
import { BUILD_HEIGHT, BUILD_RADIUS, BUILD_WIDTH, PIVOT_DISTANCE, TOP_PAD } from "./fan-geometry";
import { LiftAnchorContext } from "./lift/lift-anchor-context";
import type { MockScreenProps } from "./mocks/mock-page";

export type FanCardProps = {
  pose: CardPose;
  /** How long the glide to a new `pose` takes. */
  durationMs: number;
  /** The mock screen shown in the phone… */
  Mock: ComponentType<MockScreenProps>;
  /** …and how far into its turn it is. */
  elapsedMs: number;
  /** Hides the mock's lift piece while its foreground copy is up. */
  liftHidden: boolean;
  /** Receives where the mock's lift piece sits, in design points. */
  onAnchor: (rect: DesignRect) => void;
  testID?: string;
};

/**
 * One phone in the Welcome fan, gliding to whatever `pose` the story gives
 * it. Built at its on-stage size and scaled down elsewhere, so it is never
 * enlarged. Three nested layers each own one kind of motion — tilt about the
 * fan's pivot, translation, and size about the card's top — so they compose
 * predictably. Memoised: while one card's scene plays, the others don't
 * re-render.
 */
export const FanCard = memo(function FanCard({
  pose,
  durationMs,
  Mock,
  elapsedMs,
  liftHidden,
  onAnchor,
  testID,
}: FanCardProps) {
  const theme = useTheme();
  const { tiltStyle, shiftStyle, zoomStyle } = useCardPose(pose, durationMs);
  const frameRef = useRef<View>(null);
  const anchorContext = useMemo(
    () => ({ frameRef, onAnchor, hidden: liftHidden }),
    [onAnchor, liftHidden],
  );

  return (
    <Animated.View testID={testID} style={[styles.slot, { zIndex: pose.zIndex }, tiltStyle]}>
      <Animated.View style={[styles.fill, shiftStyle]}>
        <Animated.View
          style={[
            styles.fill,
            styles.body,
            { backgroundColor: theme.colors.deviceFrame, shadowColor: theme.colors.shadow },
            theme.elevation.card,
            zoomStyle,
          ]}
        >
          <ScaledView
            designWidth={PHONE_FRAME.width}
            designHeight={PHONE_FRAME.height}
            width={BUILD_WIDTH}
          >
            {/* The frame root the lift anchor measures against — so not collapsable. */}
            <View ref={frameRef} collapsable={false}>
              <LiftAnchorContext.Provider value={anchorContext}>
                <PhoneFrame>
                  <Mock elapsedMs={elapsedMs} />
                </PhoneFrame>
              </LiftAnchorContext.Provider>
            </View>
          </ScaledView>
        </Animated.View>
      </Animated.View>
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
  fill: { ...StyleSheet.absoluteFill },
  body: {
    borderRadius: BUILD_RADIUS,
    // Sized from the top centre, so the top edge never moves with it.
    transformOrigin: "50% 0%",
  },
});
