import { Fragment, type ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { ChevronRight } from "lucide-react-native";

import { radius, space, useTheme } from "@/theme";
import { Card } from "@/ui/atoms/Card";
import { Divider } from "@/ui/atoms/Divider";
import { VideoThumbnail } from "@/ui/atoms/VideoThumbnail";
import { SFProBody } from "@/ui/typography/SFProBody";

/** Settings' chevron size, as its rows end. */
const CHEVRON = 18;
/** The plan's artwork beside its name: small, enough to know the sermon by. */
const THUMBNAIL_WIDTH = 56;

export type PlanGroupCardProps = {
  /** The plan's title, over its card, as Weeks names its months. */
  title: string;
  /** The plan's sermon's artwork, beside its title (every Quick Check, every reflection). */
  thumbnailUrl?: string | null;
  /** Each row: what it is, a line under it (a date, what's left), and a small picture of it, if it has one. */
  rows: readonly { id: string; title: string; detail: string; picture?: ReactNode }[];
  onOpen: (id: string) => void;
  /** Each row's, as `${testID}-${row.id}`. */
  testID: string;
};

/**
 * One plan's part of a list (every reflection, every Quick Check): its name
 * in the quiet label Weeks names its months with — its artwork beside it,
 * where given — then Settings' group card: each row what it is, a line under
 * it, and the chevron.
 */
export function PlanGroupCard({ title, thumbnailUrl, rows, onOpen, testID }: PlanGroupCardProps) {
  const theme = useTheme();

  return (
    <View style={{ gap: space[8] }}>
      <View style={[styles.title, { gap: space[10] }]}>
        {thumbnailUrl !== undefined && (
          <VideoThumbnail
            uri={thumbnailUrl}
            style={[styles.thumbnail, { borderRadius: radius[10] }]}
          />
        )}
        <SFProBody
          variant="label"
          tone="textSupporting"
          accessibilityRole="header"
          numberOfLines={2}
          style={styles.titleText}
        >
          {title}
        </SFProBody>
      </View>
      <Card radius={24} style={styles.card}>
        {rows.map((row, index) => (
          <Fragment key={row.id}>
            {index > 0 && <Divider />}
            <Pressable
              testID={`${testID}-${row.id}`}
              accessibilityRole="button"
              accessibilityLabel={`${row.title}, ${row.detail}`}
              onPress={() => onOpen(row.id)}
              style={[
                styles.row,
                { gap: space[16], paddingHorizontal: space[16], paddingVertical: space[14] },
              ]}
            >
              <View style={[styles.copy, { gap: space[2] }]}>
                <SFProBody numberOfLines={2}>{row.title}</SFProBody>
                <SFProBody variant="rowDetail" tone="textSupporting">
                  {row.detail}
                </SFProBody>
              </View>
              {/* A row's picture, in a fixed place before its chevron, as Progress's rows hold theirs. */}
              {row.picture}
              <ChevronRight
                size={CHEVRON}
                color={theme.colors.textSupporting}
                strokeWidth={theme.icon.strokeWidthStrong}
              />
            </Pressable>
          </Fragment>
        ))}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  // As Weeks' month names sit: a little in from the card's edge.
  title: {
    paddingTop: space[12],
    paddingHorizontal: space[4],
    flexDirection: "row",
    alignItems: "center",
  },
  titleText: { flex: 1 },
  thumbnail: { width: THUMBNAIL_WIDTH },
  card: { overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center" },
  copy: { flex: 1 },
});
