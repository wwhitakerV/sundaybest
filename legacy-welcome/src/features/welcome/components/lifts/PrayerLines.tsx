import { StyleSheet, View } from "react-native";

import { PRAYER_LINES, getFilledPerLine, getPrayScene } from "../../logic/scenes";
import type { LiftPieceProps } from "../../logic/lift-piece";
import { space } from "@/theme";
import { SerifBody } from "@/ui/typography/SerifBody";
import { Span } from "@/ui/typography/Span";

/**
 * The day's prayer. It rests grey; as its scene plays, black fills across it
 * a character at a time, line after line — a karaoke highlight, as if it were
 * being read aloud. Each line is just two runs of text (filled, then not), so
 * it stays sharp and cheap to redraw.
 */
export function PrayerLines({ elapsedMs }: LiftPieceProps) {
  const filledPerLine = getFilledPerLine(getPrayScene(elapsedMs).filledChars);

  return (
    <View style={styles.lines}>
      {PRAYER_LINES.map((line, position) => {
        const filled = filledPerLine.at(position) ?? 0;
        return (
          <SerifBody tone="border" key={line}>
            <Span tone="text">{line.slice(0, filled)}</Span>
            {line.slice(filled)}
          </SerifBody>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  lines: { paddingVertical: space[4] },
});
