import { StyleSheet, View } from "react-native";

import { HAND_DROP, SUPPORT_OPACITY } from "../logic/fan-geometry";
import { SIDE_CARDS } from "../logic/story";
import { SideCard } from "./SideCard";
import { getScreenMock } from "./stage-parts";

/**
 * The side phones in drawing order: outermost first, so on each side the
 * phone nearer the middle lies on top, the same both ways. `index` is still
 * each one's place left to right, for when it fans.
 */
const SIDE_CARD_STACK = SIDE_CARDS.map((card, index) => ({ ...card, index })).sort(
  (a, b) => Math.abs(b.angleDeg) - Math.abs(a.angleDeg),
);

export type SideHandProps = {
  /** Whether the side phones are fanned out from behind the big one. */
  fanned: boolean;
  /** Each side phone's testID starts with this. */
  testIDPrefix?: string;
};

/**
 * The small dimmed phones fanned behind the stage's big one. Dimmed as one
 * layer: each phone is solid within it, so where they overlap one never
 * shows through another.
 */
export function SideHand({ fanned, testIDPrefix }: SideHandProps) {
  return (
    <View style={styles.hand}>
      {SIDE_CARD_STACK.map(({ screen, step, angleDeg, index }) => (
        <SideCard
          key={`${screen}:${step}`}
          Mock={getScreenMock(screen)}
          step={step}
          index={index}
          angleDeg={angleDeg}
          fanned={fanned}
          {...(testIDPrefix && { testID: `${testIDPrefix}-side-${screen}-${step}` })}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  hand: { ...StyleSheet.absoluteFill, top: HAND_DROP, opacity: SUPPORT_OPACITY },
});
