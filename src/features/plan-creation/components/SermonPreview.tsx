import { StyleSheet, Text, View } from "react-native";
import { Check, Link2, Play } from "lucide-react-native";

import { useTheme } from "@/theme";

export type SermonPreviewProps = {
  /** The link, shortened for display. */
  link: string;
  title: string;
  church: string | null;
  /** Shown on the thumbnail, `m:ss`. */
  duration: string;
  testID: string;
};

/** The checked link, and the sermon it points to: a thumbnail, its title, and its church. */
export function SermonPreview({ link, title, church, duration, testID }: SermonPreviewProps) {
  const theme = useTheme();

  return (
    <View testID={testID} style={styles.wrap}>
      <View
        style={[
          styles.link,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.divider },
        ]}
      >
        <Link2 size={22} color={theme.colors.textMuted} strokeWidth={theme.icon.strokeWidth} />
        <Text
          numberOfLines={1}
          style={[theme.typography.body, styles.grow, { color: theme.colors.text }]}
        >
          {link}
        </Text>
        <View style={[styles.check, { backgroundColor: theme.colors.segmentBackground }]}>
          <Check size={20} color={theme.colors.selected} strokeWidth={theme.icon.strokeWidth} />
        </View>
      </View>

      <View
        style={[
          styles.card,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.divider },
        ]}
      >
        {/* The video's own thumbnail isn't fetched yet; a still frame stands in. */}
        <View style={[styles.thumbnail, { backgroundColor: theme.colors.segmentBackground }]}>
          <Play size={32} color={theme.colors.textMuted} strokeWidth={theme.icon.strokeWidth} />
          <View
            style={[
              styles.duration,
              { backgroundColor: theme.colors.mediaScrim, borderRadius: theme.radii.pill },
            ]}
          >
            <Text style={[theme.typography.stepCounter, { color: theme.colors.onMediaScrim }]}>
              {duration}
            </Text>
          </View>
        </View>
        <View style={styles.text}>
          <Text style={[theme.typography.listItem, styles.title, { color: theme.colors.text }]}>
            {title}
          </Text>
          {church && (
            <Text style={[theme.typography.body, { color: theme.colors.textMuted }]}>{church}</Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 16 },
  link: {
    height: 64,
    borderWidth: 1,
    borderRadius: 32,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 20,
    paddingRight: 8,
    gap: 12,
  },
  grow: { flex: 1 },
  check: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },
  card: { borderWidth: 1, borderRadius: 28, padding: 12, gap: 12 },
  thumbnail: {
    aspectRatio: 16 / 9,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  duration: {
    position: "absolute",
    right: 12,
    bottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  text: { paddingHorizontal: 8, paddingBottom: 6, gap: 2 },
  title: { fontSize: 20 },
});
