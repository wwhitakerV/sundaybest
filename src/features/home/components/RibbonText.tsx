import { StyleSheet, View } from "react-native";
import type { SharedValue } from "react-native-reanimated";

import { RibbonLetter, type RibbonKind } from "./RibbonLetter";

export type RibbonTextProps = {
  text: string;
  /** Its first letter's slot on the ribbon. */
  start: number;
  progress: SharedValue<number>;
  kind: RibbonKind;
  testID?: string;
};

/**
 * A line written out as a ribbon (`useRibbon`): every letter its own, landing
 * in turn, laid out word by word so it wraps as text does. VoiceOver reads it
 * whole.
 */
export function RibbonText({ text, start, progress, kind, testID }: RibbonTextProps) {
  const words = text.split(" ");
  // Each word's first letter's place in the line: the words before it, and a space after each.
  const firsts = words.map((_, index) =>
    words.slice(0, index).reduce((sum, word) => sum + word.length + 1, 0),
  );
  return (
    <View
      testID={testID}
      accessible
      accessibilityRole="text"
      accessibilityLabel={text}
      style={styles.text}
    >
      {words.map((word, index) => {
        const first = firsts.at(index) ?? 0;
        // Each word with its following space, so a line breaks between words, never in one.
        const letters = index < words.length - 1 ? `${word} ` : word;
        return (
          <View
            key={`${first}-${word}`}
            style={styles.word}
            importantForAccessibility="no-hide-descendants"
          >
            {[...letters].map((letter, offset) => (
              <RibbonLetter
                key={first + offset}
                letter={letter}
                slot={start + first + offset}
                progress={progress}
                kind={kind}
              />
            ))}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  text: { flexDirection: "row", flexWrap: "wrap" },
  word: { flexDirection: "row" },
});
