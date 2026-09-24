import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/theme";
import { SCRIPTURE_WORDS, getScriptureScene } from "../../logic/scenes";
import type { LiftPieceProps } from "./lift-piece";

// Stable keys for the words; a word can repeat, its position can't.
const WORDS = SCRIPTURE_WORDS.map((text, position) => ({ key: `${position}-${text}`, text }));

/**
 * The verse card. As its scene plays, the words light up one after another,
 * as if someone were reading along; unread words sit quiet.
 */
export function VerseCard({ elapsedMs }: LiftPieceProps) {
  const theme = useTheme();
  const { litWords } = getScriptureScene(elapsedMs);

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.colors.background, borderColor: theme.colors.divider },
      ]}
    >
      <Text style={[theme.typography.scripture, { color: theme.colors.text }]}>
        <Text style={theme.typography.metaEmphasis}>8 </Text>
        {WORDS.map(({ key, text }, position) => (
          <Text
            key={key}
            style={{ color: position < litWords ? theme.colors.text : theme.colors.border }}
          >
            {position < WORDS.length - 1 ? `${text} ` : text}
          </Text>
        ))}
      </Text>
    </View>
  );
}

/** Its corners — shared with the floating card it lifts onto. */
export const VERSE_CARD_RADIUS = 24;

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: VERSE_CARD_RADIUS,
    paddingHorizontal: 22,
    paddingVertical: 18,
  },
});
