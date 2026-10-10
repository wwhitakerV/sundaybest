import { StyleSheet, View } from "react-native";
import { Check, Link2 } from "lucide-react-native";

import { VideoThumbnail } from "@/ui/atoms/VideoThumbnail";
import { radius, space, useTheme } from "@/theme";
import { Card } from "@/ui/atoms/Card";
import { SFProBody } from "@/ui/typography/SFProBody";
import { SFProTitle } from "@/ui/typography/SFProTitle";

export type SermonPreviewProps = {
  /** The link, shortened for display. */
  link: string;
  title: string;
  church: string | null;
  thumbnailUrl: string | null;
  /** Shown on the thumbnail, `m:ss`. */
  duration?: string;
  testID: string;
};

/** The checked link, and the sermon it points to: a thumbnail, its title, and its church. */
export function SermonPreview({
  link,
  title,
  church,
  thumbnailUrl,
  duration,
  testID,
}: SermonPreviewProps) {
  const theme = useTheme();

  return (
    <View testID={testID} style={styles.wrap}>
      <Card edge={false} radius={32} style={styles.link}>
        <Link2 size={22} color={theme.colors.textMuted} strokeWidth={theme.icon.strokeWidth} />
        <SFProBody style={styles.grow} numberOfLines={1}>
          {link}
        </SFProBody>
        <View style={[styles.check, { backgroundColor: theme.colors.segmentBackground }]}>
          <Check size={20} color={theme.colors.selected} strokeWidth={theme.icon.strokeWidth} />
        </View>
      </Card>

      <Card edge={false} style={styles.card}>
        <VideoThumbnail
          uri={thumbnailUrl}
          {...(duration !== undefined ? { duration } : {})}
          style={styles.thumbnail}
        />
        <View style={styles.text}>
          <SFProTitle variant="preview">{title}</SFProTitle>
          {church && <SFProBody tone="textMuted">{church}</SFProBody>}
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space[16] },
  link: {
    height: 64,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: space[20],
    paddingRight: space[8],
    gap: space[12],
  },
  grow: { flex: 1 },
  check: {
    width: 46,
    height: 46,
    borderRadius: radius[23],
    alignItems: "center",
    justifyContent: "center",
  },
  card: { padding: space[12], gap: space[12] },
  thumbnail: { borderRadius: radius[20] },
  text: { paddingHorizontal: space[8], paddingBottom: space[6], gap: space[2] },
});
