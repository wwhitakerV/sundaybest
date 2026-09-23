import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/theme";
import { READ_WORDS, getReadScene } from "../../logic/scenes";
import type { LiftPieceProps } from "./lift-piece";

// Stable keys for the words; a word can repeat, its position can't.
const WORDS = READ_WORDS.map((text, position) => ({ key: `${position}-${text}`, text }));

/**
 * The verse card. As its scene plays, the words light up one after another,
 * as if someone were reading along; unread words sit quiet.
 */
export function VerseCard({ elapsedMs }: LiftPieceProps) {
  const theme = useTheme();
  const { litWords } = getReadScene(elapsedMs);

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
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

const styles = StyleSheet.create({
  card: { borderRadius: 24, paddingHorizontal: 22, paddingVertical: 18 },
});
