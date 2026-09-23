import type { ComponentType } from "react";
import { StyleSheet } from "react-native";
import Animated from "react-native-reanimated";

import { useTheme } from "@/theme";
import { useLiftMotion } from "../../hooks/use-lift-motion";
import type { DesignRect, LiftLayout } from "../../logic/lift";
import type { LiftPieceProps } from "../lifts/lift-piece";

export type StageLiftProps = {
  /** The piece to lift, and how far into its scene the story is. */
  Piece: ComponentType<LiftPieceProps>;
  elapsedMs: number;
  /** Its size and place in the mock — it's laid out at exactly this size. */
  anchor: DesignRect;
  layout: LiftLayout;
  /** The floating card's padding around the piece, at real size. */
  cardPadding: number;
  /** Up in the foreground, or on its way back down. */
  lifted: boolean;
};

/**
 * The foreground copy of a card's lift piece: the real component at real
 * size, springing up off the phone onto a floating card, playing, and
 * snapping back. It starts and ends exactly over the phone's copy (which
 * hides meanwhile), and the card behind it only exists once it's off the
 * phone — so the hand-off can't be seen. Mount one per turn.
 */
export function StageLift({
  Piece,
  elapsedMs,
  anchor,
  layout,
  cardPadding,
  lifted,
}: StageLiftProps) {
  const theme = useTheme();
  const { moveStyle, sizeStyle, cardStyle } = useLiftMotion(lifted, layout);

  return (
    <Animated.View pointerEvents="none" style={[styles.move, moveStyle]}>
      <Animated.View
        style={[styles.size, { width: anchor.width, height: anchor.height }, sizeStyle]}
      >
        {/* The floating card: behind the piece, past its edges, never changing its size. */}
        <Animated.View
          style={[
            styles.card,
            {
              top: -cardPadding,
              left: -cardPadding,
              right: -cardPadding,
              bottom: -cardPadding,
              borderRadius: cardPadding + 18,
              backgroundColor: theme.colors.background,
              borderColor: theme.colors.hairline,
              shadowColor: theme.colors.shadow,
            },
            theme.elevation.card,
            cardStyle,
          ]}
        />
        <Piece elapsedMs={elapsedMs} />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  move: { position: "absolute", left: 0, top: 0 },
  size: { transformOrigin: "0% 0%" },
  card: { position: "absolute", borderWidth: 1 },
});
