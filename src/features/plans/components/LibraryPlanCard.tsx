import { Pressable, StyleSheet, Text, View } from "react-native";
import { Check, ChevronRight } from "lucide-react-native";

import { VideoThumbnail } from "@/ui/VideoThumbnail";
import { useTheme } from "@/theme";
import type { LibraryPlanLook } from "../logic/library";

const CARD_RADIUS = 36;
const CARD_PADDING = 16;

export type LibraryPlanCardProps = {
  title: string;
  thumbnailUrl: string | null;
  look: LibraryPlanLook;
  onPress: () => void;
  testID: string;
};

/**
 * One plan in the library: its sermon's thumbnail, where it stands (a pill),
 * its title, and a line — the day it's on, when it finished, or how long it
 * is — with what opening it does. The whole card opens the plan.
 */
export function LibraryPlanCard({
  title,
  thumbnailUrl,
  look,
  onPress,
  testID,
}: LibraryPlanCardProps) {
  const theme = useTheme();

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityHint="Opens the plan"
      onPress={onPress}
      style={[
        styles.card,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.divider },
      ]}
    >
      <VideoThumbnail uri={thumbnailUrl} style={styles.thumbnail} />
      <View style={styles.body}>
        <View
          style={[
            styles.pill,
            { borderColor: theme.colors.divider, borderRadius: theme.radii.pill },
          ]}
        >
          {look.done && (
            <Check size={16} color={theme.colors.text} strokeWidth={theme.icon.strokeWidth} />
          )}
          <Text style={[theme.typography.label, { color: theme.colors.text }]}>{look.status}</Text>
        </View>
        <Text style={[theme.typography.screenTitle, { color: theme.colors.text }]}>{title}</Text>
        <View style={styles.footer}>
          <Text style={[theme.typography.body, { color: theme.colors.textMuted }]}>
            {look.detail}
          </Text>
          <View style={styles.action}>
            <Text style={[theme.typography.button, { color: theme.colors.text }]}>
              {look.action}
            </Text>
            <ChevronRight
              size={20}
              color={theme.colors.text}
              strokeWidth={theme.icon.strokeWidth}
            />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: CARD_RADIUS, padding: CARD_PADDING, gap: 20 },
  // Its corners follow the card's, just inside its padding.
  thumbnail: { borderRadius: CARD_RADIUS - CARD_PADDING + 4 },
  body: { paddingHorizontal: 8, paddingBottom: 8, gap: 12 },
  pill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  action: { flexDirection: "row", alignItems: "center", gap: 4 },
});
