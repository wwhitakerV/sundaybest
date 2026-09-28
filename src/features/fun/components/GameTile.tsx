import { Image, Pressable, StyleSheet, Text, View, type ImageSourcePropType } from "react-native";
import type { LucideIcon } from "lucide-react-native";

import { ChevronBadge } from "@/ui/ChevronBadge";
import { GradientBackdrop } from "@/ui/GradientBackdrop";
import { Tag } from "@/ui/Tag";
import { useTheme } from "@/theme";
import { getBackdropStops } from "@/utils/color/getBackdropStops";

const MIN_HEIGHT = 100;
/** The line under the title keeps to this share, clear of most of the art. */
const DETAIL_WIDTH = "62%";

export type GameTileProps = {
  title: string;
  detail: string;
  art: ImageSourcePropType;
  /** The art's own width over its height. */
  artAspect: number;
  /** The art's share of the tile's width, sized to the mockup's weight for it. */
  artWidth: `${number}%`;
  /** The pastel behind it (`theme.colors.illustration*`). */
  background: string;
  /** A second pastel the first blends into toward the lower right, if any. */
  blendTo?: string;
  /** A tag under the title — Daily Trivia's streak — its icon in the accent. */
  badge?: { label: string; icon: LucideIcon };
  /** Where it goes, for VoiceOver: "Opens Daily Trivia". */
  accessibilityHint: string;
  onPress: () => void;
  testID: string;
};

/**
 * One game in Fun's grid, all of it one button: its name and a line on it in
 * the upper left, its illustration on the right, and a chevron in the lower
 * left, on a pastel of its own. At least 100 pt tall, and taller as the text
 * grows.
 */
export function GameTile({
  title,
  detail,
  art,
  artAspect,
  artWidth,
  background,
  blendTo,
  badge,
  accessibilityHint,
  onPress,
  testID,
}: GameTileProps) {
  const theme = useTheme();

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={[title, badge?.label, detail].filter(Boolean).join(". ")}
      accessibilityHint={accessibilityHint}
      onPress={onPress}
      style={[
        styles.tile,
        {
          backgroundColor: background,
          borderRadius: theme.radii.card,
          padding: theme.spacing.md,
        },
      ]}
    >
      {blendTo && <GradientBackdrop stops={getBackdropStops([blendTo, background], background)} />}
      <View
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={[styles.artSlot, { width: artWidth }]}
      >
        <Image source={art} style={[styles.art, { aspectRatio: artAspect }]} />
      </View>

      <Text style={[theme.typography.tileTitle, { color: theme.colors.inkOnLight }]}>{title}</Text>
      {badge && (
        <View style={[styles.badge, { marginTop: theme.spacing.sm }]}>
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
      <Text
        style={[
          theme.typography.cardDetail,
          styles.detail,
          { color: theme.colors.inkOnLightMuted, marginTop: theme.spacing.xs },
        ]}
      >
        {detail}
      </Text>

      <View style={[styles.foot, { paddingTop: theme.spacing.sm }]}>
        <ChevronBadge />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: { flex: 1, minHeight: MIN_HEIGHT, overflow: "hidden" },
  // Holds the art against the tile's right edge, centred top to bottom.
  artSlot: { position: "absolute", top: 0, right: 0, bottom: 0, justifyContent: "center" },
  art: { width: "100%" },
  badge: { alignSelf: "flex-start" },
  detail: { maxWidth: DETAIL_WIDTH },
  // Takes whatever height is left, so the chevron always sits in the lower left.
  foot: { flex: 1, justifyContent: "flex-end", alignItems: "flex-start" },
});
