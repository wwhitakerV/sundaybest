import { Pressable, StyleSheet, View } from "react-native";

import { VideoThumbnail } from "@/ui/atoms/VideoThumbnail";
import { radius, space } from "@/theme";
import type { LibraryPlanLook } from "../logic/library";
import { MonoLabel } from "@/ui/typography/MonoLabel";
import { SFProTitle } from "@/ui/typography/SFProTitle";

const TITLE_LINES = 2;

export type LibraryPlanCardProps = {
  title: string;
  thumbnailUrl: string | null;
  look: LibraryPlanLook;
  /** Opens the plan. */
  onPress: () => void;
  testID: string;
  /** Its thumbnail's. */
  thumbnailTestID: string;
};

/**
 * One plan in the library, the page's full width: its sermon's thumbnail at
 * 16:9, then its title and, under it, where it stands. The whole of it opens
 * the plan.
 */
export function LibraryPlanCard({
  title,
  thumbnailUrl,
  look,
  onPress,
  testID,
  thumbnailTestID,
}: LibraryPlanCardProps) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${look.summary}`}
      accessibilityHint="Opens the plan"
      onPress={onPress}
      style={[styles.card, { gap: space[16] }]}
    >
      <VideoThumbnail
        testID={thumbnailTestID}
        uri={thumbnailUrl}
        style={{ borderRadius: radius[16] }}
      />

      <View style={{ gap: space[4] }}>
        <SFProTitle variant="card" numberOfLines={TITLE_LINES}>
          {title}
        </SFProTitle>
        <MonoLabel tone="textMuted" numberOfLines={1}>
          {look.summary}
        </MonoLabel>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { width: "100%" },
});
