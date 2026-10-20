import { useRef, type RefObject } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { space } from "@/theme";
import { VerseActions } from "./VerseActions";
import { VerseCaption } from "./VerseCaption";
import { VerseOfTheDay } from "./VerseOfTheDay";
import { VerseShareCard } from "./VerseShareCard";

export type VerseCardProps = {
  verse: string;
  reference: string;
  /** The bare reference, to name the verse aloud: "Colossians 3:13". */
  passage: string;
  caption: string;
  day: string;
  liked: boolean;
  onLike: () => void;
  /** Shares the verse, with the share card to take its picture from. */
  onShare: (shareCard: RefObject<View | null>) => Promise<void>;
  testID: string;
};

/**
 * The verse of the day on Home, under the plan: set on the page itself, no
 * card or edge round it, with room above and around it. Tapped, it's shared
 * (iOS's share sheet); beneath it, centred, a heart to like it and Share; and
 * last, the day's line. Beside it, off the screen, the picture that's shared
 * (`VerseShareCard`).
 */
export function VerseCard({
  passage,
  caption,
  liked,
  onLike,
  onShare,
  testID,
  ...verse
}: VerseCardProps) {
  const shareCard = useRef<View>(null);
  const share = () => void onShare(shareCard);
  return (
    <View testID={`${testID}-section`} style={styles.section}>
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={`Verse of the day, ${passage}. Share`}
        accessibilityHint="Opens the share sheet"
        onPress={share}
      >
        <VerseOfTheDay testID={`${testID}-content`} {...verse} />
      </Pressable>
      <VerseActions testID={`${testID}-actions`} liked={liked} onLike={onLike} onShare={share} />
      <VerseCaption testID={`${testID}-caption`}>{caption}</VerseCaption>
      <VerseShareCard ref={shareCard} testID={`${testID}-share-card`} {...verse} />
    </View>
  );
}

const styles = StyleSheet.create({
  // Its own room on top of the page's gap: the verse stands apart from the plan.
  section: { marginTop: space[28], gap: space[32] },
});
