import { StyleSheet, View } from "react-native";

import { radius, space } from "@/theme";
import { VideoThumbnail } from "@/ui/atoms/VideoThumbnail";
import { SFProBody } from "@/ui/typography/SFProBody";

/** The plan's artwork, small: enough to know the sermon by, as Plans' search shows it. */
const THUMBNAIL_WIDTH = 72;

/** A module's first row: the plan it's from, by its artwork and its title on up to two lines. */
export function ModulePlanRow({
  title,
  thumbnailUrl,
}: {
  title: string;
  thumbnailUrl: string | null;
}) {
  return (
    <View style={[styles.row, { gap: space[12], padding: space[16] }]}>
      <VideoThumbnail uri={thumbnailUrl} style={[styles.thumbnail, { borderRadius: radius[10] }]} />
      <SFProBody numberOfLines={2} style={styles.title}>
        {title}
      </SFProBody>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
  thumbnail: { width: THUMBNAIL_WIDTH },
  title: { flex: 1 },
});
