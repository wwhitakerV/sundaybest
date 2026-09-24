import type { ComponentType } from "react";
import { StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";

import { useTheme } from "@/theme";
import { useLiftMotion } from "../../hooks/use-lift-motion";
import type { DesignRect, LiftBacking, LiftLayout } from "../../logic/lift";
import type { LiftPieceProps } from "../lifts/lift-piece";

export type StageLiftProps = {
  /** The piece to lift, and how far into its scene the story is. */
  Piece: ComponentType<LiftPieceProps>;
  elapsedMs: number;
  /** Its size and place in the mock — it's laid out at exactly this size. */
  anchor: DesignRect;
  layout: LiftLayout;
  /** The floating card behind the piece, at real size. */
  backing: LiftBacking;
  /** Up in the foreground, or on its way back down. */
  lifted: boolean;
};

/**
 * The foreground copy of a card's lift piece: the real component at real
 * size, springing up off the phone onto a floating card, playing, and
 * snapping back. It starts and ends exactly over the phone's copy (which
 * hides meanwhile), and the card behind it only exists once it's off the
 * phone — so the hand-off can't be seen. Mount one per turn.
 *
 * The card is two layers: a thin see-through rim, which reads as frosted
 * glass over the phone and the stage behind it the whole time it's up, and a
 * solid container inside it that the piece sits on — so no piece, or part of
 * one, is ever see-through.
 */
export function StageLift({ Piece, elapsedMs, anchor, layout, backing, lifted }: StageLiftProps) {
  const theme = useTheme();
  const { moveStyle, sizeStyle, cardStyle } = useLiftMotion(lifted, layout);
  const reach = backing.rim + backing.inset;

  return (
    <Animated.View pointerEvents="none" style={[styles.move, moveStyle]}>
      <Animated.View
        style={[styles.size, { width: anchor.width, height: anchor.height }, sizeStyle]}
      >
        {/* The floating card: behind the piece, past its edges, never changing its size. */}
        <Animated.View
          testID="stage-lift-card"
          style={[
            styles.card,
            {
              top: -reach,
              left: -reach,
              right: -reach,
              bottom: -reach,
              // Concentric with the container inside it.
              borderRadius: backing.radius + backing.rim,
              backgroundColor: theme.colors.frostedRim,
              borderColor: theme.colors.hairline,
              shadowColor: theme.colors.shadow,
            },
            theme.elevation.card,
            cardStyle,
          ]}
        >
          <View
            testID="stage-lift-fill"
            style={[
              styles.fill,
              {
                // Just inside the rim (measured from inside the card's 1pt border).
                top: backing.rim - CARD_BORDER,
                left: backing.rim - CARD_BORDER,
                right: backing.rim - CARD_BORDER,
                bottom: backing.rim - CARD_BORDER,
                borderRadius: backing.radius,
                backgroundColor: theme.colors.background,
              },
            ]}
          />
        </Animated.View>
        <Piece elapsedMs={elapsedMs} />
      </Animated.View>
    </Animated.View>
  );
}

const CARD_BORDER = 1;

const styles = StyleSheet.create({
  move: { position: "absolute", left: 0, top: 0 },
  size: { transformOrigin: "0% 0%" },
  card: { position: "absolute", borderWidth: CARD_BORDER },
  fill: { position: "absolute" },
});
