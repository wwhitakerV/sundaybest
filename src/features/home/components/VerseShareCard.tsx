import type { RefObject } from "react";
import { StyleSheet, View } from "react-native";

import { space, useTheme } from "@/theme";
import { Wordmark } from "@/ui/atoms/Wordmark";
import { VerseOfTheDay, type VerseOfTheDayProps } from "./VerseOfTheDay";

/**
 * The shared picture's size, in points: 4:5, the portrait shape Messages and
 * social stories show whole. Drawn at the phone's scale, so it's sharp.
 */
const SHARE_CARD = { width: 360, height: 450 };

/**
 * Twice its width left of where it's placed: wholly past the screen's edge
 * whatever the page's inset, for the scroll doesn't clip what's beside it.
 */
const OFF_SCREEN = -2 * SHARE_CARD.width;

export type VerseShareCardProps = Omit<VerseOfTheDayProps, "testID"> & {
  /** What's snapshotted to share. */
  ref: RefObject<View | null>;
  testID: string;
};

/**
 * The verse of the day as a picture to share: Home's verse on the paper,
 * centred, signed at its foot with the painted wordmark. Drawn off the screen
 * and hidden from VoiceOver; only its snapshot is ever seen.
 */
export function VerseShareCard({ ref, testID, ...verse }: VerseShareCardProps) {
  const theme = useTheme();
  return (
    <View
      ref={ref}
      testID={testID}
      collapsable={false}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.card,
        { backgroundColor: theme.colors.surface, padding: space[32], gap: space[24] },
      ]}
    >
      <View style={styles.middle}>
        <VerseOfTheDay testID={`${testID}-verse`} {...verse} />
      </View>
      <Wordmark testID={`${testID}-wordmark`} style={styles.wordmark} />
    </View>
  );
}

const styles = StyleSheet.create({
  // Off the screen: laid out and drawn, never in view.
  card: {
    position: "absolute",
    top: 0,
    left: OFF_SCREEN,
    width: SHARE_CARD.width,
    height: SHARE_CARD.height,
  },
  middle: { flex: 1, justifyContent: "center" },
  wordmark: { alignSelf: "center" },
});
