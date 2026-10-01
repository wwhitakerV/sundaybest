import { useState } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
  type ImageStyle,
} from "react-native";
import type { LucideIcon } from "lucide-react-native";

import { ChevronBadge } from "@/ui/ChevronBadge";
import { GradientBackdrop } from "@/ui/atoms/GradientBackdrop";
import { Tag } from "@/ui/Tag";
import { useTheme } from "@/theme";
import { getBackdropStops } from "@/utils/color/getBackdropStops";
import { fitArt } from "../logic/art-frame";

/** Tall enough for the words, the art large in the middle, and the row under it. */
const MIN_HEIGHT = 250;
/** Between the art's foot and the row under it. */
const ART_TO_ROW = 10;
/** Over the tile's padding at the top, so the title sits a little lower. */
const TOP_EXTRA = 6;

export type GameTileProps = {
  title: string;
  detail: string;
  art: ImageSourcePropType;
  /** The art's own width over its height. */
  artAspect: number;
  /** The art's share of the space it's centred in (0–1): as large as that allows. */
  artShare: number;
  /** Points wider (or narrower) than that, keeping its shape. */
  artExtra?: number;
  /** A turn or tilt of the art, if any. */
  artTransform?: ImageStyle["transform"];
  /** The pastel behind it (`theme.colors.illustration*`). */
  background: string;
  /** A second pastel the first blends into toward the lower right, if any. */
  blendTo?: string;
  /** A tag at the end of the bottom row, level with the chevron — Daily Trivia's streak — its icon in the accent. */
  badge?: { label: string; icon: LucideIcon };
  /** Where it goes, for VoiceOver: "Opens Daily Trivia". */
  accessibilityHint: string;
  onPress: () => void;
  testID: string;
};

/**
 * One game in Fun's grid, all of it one button, on a pastel of its own, in
 * one order every tile keeps: its name and a line on it; its illustration,
 * centred across and as large as the room between allows, resting 10 pt
 * above the bottom row; and that row — the chevron at the start and, when it
 * has one, a tag at the end, centred on the chevron. At least 250 pt tall,
 * and taller as the words grow.
 */
export function GameTile({
  title,
  detail,
  art,
  artAspect,
  artShare,
  artExtra = 0,
  artTransform,
  background,
  blendTo,
  badge,
  accessibilityHint,
  onPress,
  testID,
}: GameTileProps) {
  const theme = useTheme();
  // Sized in points from the room it's measured to have — a percentage would
  // leave the art at its file's full size.
  const [space, setSpace] = useState({ width: 0, height: 0 });
  const size = fitArt(space, { share: artShare, aspect: artAspect, extra: artExtra });

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={[title, detail, badge?.label].filter(Boolean).join(". ")}
      accessibilityHint={accessibilityHint}
      onPress={onPress}
      style={[
        styles.tile,
        {
          backgroundColor: background,
          borderRadius: theme.radii.card,
          padding: theme.spacing.md,
          paddingTop: theme.spacing.md + TOP_EXTRA,
        },
      ]}
    >
      {blendTo && <GradientBackdrop stops={getBackdropStops([blendTo, background], background)} />}

      <Text style={[theme.typography.tileTitle, { color: theme.colors.inkOnLight }]}>{title}</Text>
      <Text
        style={[
          theme.typography.cardDetail,
          { color: theme.colors.inkOnLightMuted, marginTop: theme.spacing.xs },
        ]}
      >
        {detail}
      </Text>

      <View
        onLayout={({ nativeEvent }) =>
          setSpace({ width: nativeEvent.layout.width, height: nativeEvent.layout.height })
        }
        style={[styles.artSpace, { marginTop: theme.spacing.sm, marginBottom: ART_TO_ROW }]}
      >
        <Image
          source={art}
          resizeMode="contain"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={[size, artTransform && { transform: artTransform }]}
        />
      </View>

      <View style={[styles.foot, { gap: theme.spacing.sm }]}>
        <ChevronBadge />
        {/* Held in a box of its own: a tag sets itself to the top of its row. */}
        {badge && (
          <View>
            <Tag
              testID={`${testID}-badge`}
              icon={badge.icon}
              label={badge.label}
              color={theme.colors.inkOnLight}
              iconColor={theme.colors.accent}
              background={theme.colors.overlayButtonLight}
            />
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: { flex: 1, minHeight: MIN_HEIGHT, overflow: "hidden" },
  // Takes the room between the words and the row, the art centred across it
  // and resting on its foot, just above the row.
  artSpace: { flex: 1, alignItems: "center", justifyContent: "flex-end" },
  // The chevron at the start, a tag at the end, centred on each other.
  foot: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
});
