import { Pressable, StyleSheet, Text, View } from "react-native";

import { VideoThumbnail } from "@/ui/VideoThumbnail";
import { useTheme } from "@/theme";
import type { LibraryPlanLook } from "../logic/library";

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
  const theme = useTheme();

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${look.summary}`}
      accessibilityHint="Opens the plan"
      onPress={onPress}
      style={[styles.card, { gap: theme.spacing.md }]}
    >
      <VideoThumbnail
        testID={thumbnailTestID}
        uri={thumbnailUrl}
        style={{ borderRadius: theme.radii.lg }}
      />

      <View style={{ gap: theme.spacing.xs }}>
        <Text
          numberOfLines={TITLE_LINES}
          style={[theme.typography.cardTitle, { color: theme.colors.text }]}
        >
          {title}
        </Text>
        <Text
          numberOfLines={1}
          style={[theme.typography.metaLabel, { color: theme.colors.textMuted }]}
        >
          {look.summary}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { width: "100%" },
});
