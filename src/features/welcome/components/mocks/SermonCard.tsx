import { Image, StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/theme";
import sermonThumbnail from "../../../../../assets/images/welcome/sermon-thumbnail.png";

/** The video thumbnail's own proportions — 16:9 — so it's never squashed or cropped. */
const THUMBNAIL_ASPECT = 16 / 9;
const RADIUS = 26;

/** The sermon a plan is built from: its thumbnail, full width across the top, then its title and church. */
export function SermonCard() {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.colors.background, borderColor: theme.colors.divider },
      ]}
    >
      {/* The frame sets the size — full card width, 16:9 — and the photo
          fills it. Sizing the Image itself lets its file's own pixel size leak
          into layout and leave it short of the card's edge. */}
      <View style={styles.thumbnail}>
        <Image
          source={sermonThumbnail}
          style={styles.fill}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />
      </View>
      <View style={styles.text}>
        <Text numberOfLines={1} style={[theme.typography.listItem, { color: theme.colors.text }]}>
          Choose Whom You Will Serve
        </Text>
        <Text style={[theme.typography.body, { color: theme.colors.textMuted }]}>VOUS Church</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: RADIUS, overflow: "hidden" },
  thumbnail: { alignSelf: "stretch", aspectRatio: THUMBNAIL_ASPECT },
  // Explicit 100% of a frame whose size is already fixed, so it can't fall
  // back to the image file's own dimensions.
  fill: { width: "100%", height: "100%" },
  text: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 14, gap: 2 },
});
