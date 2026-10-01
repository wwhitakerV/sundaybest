import { StyleSheet } from "react-native";

import { radius, space } from "@/theme";
import { Card } from "@/ui/atoms/Card";
import { SCRIPTURE_WORDS, getScriptureScene } from "../../logic/scenes";
import type { LiftPieceProps } from "../../logic/lift-piece";
import { SerifBody } from "@/ui/typography/SerifBody";
import { MonoLabel } from "@/ui/typography/MonoLabel";
import { Span } from "@/ui/typography/Span";

// Stable keys for the words; a word can repeat, its position can't.
const WORDS = SCRIPTURE_WORDS.map((text, position) => ({ key: `${position}-${text}`, text }));

/**
 * The verse card. As its scene plays, the words light up one after another,
 * as if someone were reading along; unread words sit quiet.
 */
export function VerseCard({ elapsedMs }: LiftPieceProps) {
  const { litWords } = getScriptureScene(elapsedMs);

  return (
    <Card radius={VERSE_CARD_RADIUS} fill="page" style={styles.card}>
      <SerifBody>
        <MonoLabel variant="emphasis">8 </MonoLabel>
        {WORDS.map(({ key, text }, position) => (
          <Span key={key} tone={position < litWords ? "text" : "border"}>
            {position < WORDS.length - 1 ? `${text} ` : text}
          </Span>
        ))}
      </SerifBody>
    </Card>
  );
}

/** Its corners — shared with the floating card it lifts onto. */
export const VERSE_CARD_RADIUS = radius[24];

const styles = StyleSheet.create({
  card: { paddingHorizontal: space[22], paddingVertical: space[18] },
});
