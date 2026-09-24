import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/theme";
import { PRAYER_LINES, getFilledPerLine, getPrayScene } from "../../logic/scenes";
import type { LiftPieceProps } from "./lift-piece";

/**
 * The day's prayer. It rests grey; as its scene plays, black fills across it
 * a character at a time, line after line — a karaoke highlight, as if it were
 * being read aloud. Each line is just two runs of text (filled, then not), so
 * it stays sharp and cheap to redraw.
 */
export function PrayerLines({ elapsedMs }: LiftPieceProps) {
  const theme = useTheme();
  const filledPerLine = getFilledPerLine(getPrayScene(elapsedMs).filledChars);

  return (
    <View style={styles.lines}>
      {PRAYER_LINES.map((line, position) => {
        const filled = filledPerLine.at(position) ?? 0;
        return (
          <Text key={line} style={[theme.typography.scripture, { color: theme.colors.border }]}>
            <Text style={{ color: theme.colors.text }}>{line.slice(0, filled)}</Text>
            {line.slice(filled)}
          </Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  lines: { paddingVertical: 4 },
});
