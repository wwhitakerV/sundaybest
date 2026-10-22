import { StyleSheet, View, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import { ChevronRight, RectangleVertical, Smartphone, type LucideIcon } from "lucide-react-native";

import { POSTER, type PosterFormat } from "@/entities/rise";
import { iconSize, radius, space, useTheme } from "@/theme";
import { Bone } from "@/ui/atoms/Bone";
import { Card } from "@/ui/atoms/Card";
import { BottomSheet } from "@/ui/organisms/BottomSheet";
import { SFProBody } from "@/ui/typography/SFProBody";
import type { RisePosters } from "../hooks/use-rise-share";

/** Most of the screen: room for the poster and both cards under it. */
const SHEET_HEIGHT = 0.8;
/**
 * The room the sheet's own parts and the two cards take, below and above the
 * poster: grabber and title, the gaps, the cards, the inset at its foot.
 */
const AROUND_POSTER = 400;

/** Where each shape goes, said plainly: people pick a place, not a ratio. */
const FORMATS: { format: PosterFormat; icon: LucideIcon; title: string; detail: string }[] = [
  {
    format: "post",
    icon: RectangleVertical,
    title: "Post · 4:5",
    detail: "For your feed, or to send: Instagram, Messages, X.",
  },
  {
    format: "story",
    icon: Smartphone,
    title: "Story · 9:16",
    detail: "Full screen, for Instagram and Snapchat Stories.",
  },
];

export type PosterSheetProps = {
  visible: boolean;
  /** Both posters, once drawn — null while they're being drawn. */
  posters: RisePosters | null;
  onPick: (format: PosterFormat) => void;
  onClose: () => void;
};

/** One way to share: its icon, where it goes and what it's for, and a chevron — the card a button. */
function FormatCard({
  icon: Icon,
  title,
  detail,
  onPress,
  testID,
}: {
  icon: LucideIcon;
  title: string;
  detail: string;
  onPress: () => void;
  testID: string;
}) {
  const { colors, icon } = useTheme();
  return (
    <Card testID={testID} accessibilityLabel={`${title}. ${detail}`} onPress={onPress}>
      <View style={styles.cardRow}>
        <Icon size={iconSize.row} color={colors.text} strokeWidth={icon.strokeWidth} />
        <View style={styles.cardWords}>
          <SFProBody>{title}</SFProBody>
          <SFProBody variant="rowDetail" tone="textSupporting">
            {detail}
          </SFProBody>
        </View>
        <ChevronRight
          size={iconSize.chevron}
          color={colors.textSupporting}
          strokeWidth={icon.strokeWidth}
        />
      </View>
    </Card>
  );
}

/**
 * Share: the reader's own board as a poster, at the top — the run as it
 * goes out — and under it two cards, a post and a story, each saying where
 * it goes. A tap sends that one to iOS's share sheet. While the poster's
 * drawn, a frame, a still shape stands in its place.
 */
export function PosterSheet({ visible, posters, onPick, onClose }: PosterSheetProps) {
  const { colors } = useTheme();
  const window = useWindowDimensions();
  const tall = Math.max(0, window.height * SHEET_HEIGHT - AROUND_POSTER);
  const wide = (tall * POSTER.post.width) / POSTER.post.height;

  return (
    <BottomSheet
      testID="rise-share-sheet"
      visible={visible}
      onClose={onClose}
      accessibilityLabel="Share"
      heightRatio={SHEET_HEIGHT}
    >
      <View style={styles.body}>
        <View style={styles.preview}>
          {posters?.post ? (
            <Image
              testID="rise-share-poster"
              source={{ uri: `data:image/png;base64,${posters.post}` }}
              style={[
                styles.poster,
                { width: wide, height: tall, borderColor: colors.containerBorder },
              ]}
              contentFit="cover"
              accessibilityLabel="Your board, as it'll be shared"
            />
          ) : (
            <Bone width={wide} height={tall} radius={radius[16]} />
          )}
        </View>
        <View style={styles.cards}>
          {FORMATS.map(({ format, ...card }) => (
            <FormatCard
              key={format}
              testID={`rise-share-${format}`}
              {...card}
              onPress={() => onPick(format)}
            />
          ))}
        </View>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: { gap: space[24] },
  preview: { alignItems: "center" },
  poster: { borderRadius: radius[16], borderWidth: 1 },
  cards: { gap: space[12] },
  cardRow: { flexDirection: "row", alignItems: "center", gap: space[16] },
  cardWords: { flex: 1, gap: space[2] },
});
