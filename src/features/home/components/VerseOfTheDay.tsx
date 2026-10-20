import { StyleSheet, View } from "react-native";

import { space } from "@/theme";
import { MonoLabel } from "@/ui/typography/MonoLabel";
import { SerifBody } from "@/ui/typography/SerifBody";

export type VerseOfTheDayProps = {
  verse: string;
  /** "Colossians 3:13 · BSB". */
  reference: string;
  /** "Monday, October 19". */
  day: string;
  testID: string;
};

/**
 * The verse of the day: its name in the red tracked mono, the verse centred in
 * the Scripture face, then where it's from in red and the day it's for, quiet
 * beneath. No paint: on Home the wordmark's stroke is the page's one. Home's
 * verse and the picture that's shared are both this.
 */
export function VerseOfTheDay({ verse, reference, day, testID }: VerseOfTheDayProps) {
  return (
    <View testID={testID} style={styles.verse}>
      <MonoLabel variant="kicker" tone="accent">
        Verse of the day
      </MonoLabel>
      <SerifBody style={[styles.text, styles.words]}>{verse}</SerifBody>
      <View style={styles.source}>
        <MonoLabel variant="kicker" tone="accent" style={styles.text}>
          {reference}
        </MonoLabel>
        <MonoLabel variant="labelTracked" tone="textSupporting">
          {day}
        </MonoLabel>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  verse: { alignItems: "center" },
  words: { marginTop: space[28], marginBottom: space[20] },
  source: { alignItems: "center", gap: space[6] },
  text: { textAlign: "center" },
});
