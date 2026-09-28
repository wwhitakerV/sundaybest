import { Image, Pressable, StyleSheet, Text, View, type ImageSourcePropType } from "react-native";
import type { LucideIcon } from "lucide-react-native";

import { ChevronBadge } from "@/ui/ChevronBadge";
import { Tag } from "@/ui/Tag";
import { useTheme } from "@/theme";

/** The art's share of the tile's width inside its padding, before it runs out to the edges. */
const ART_WIDTH = "82%";

export type GameTileProps = {
  title: string;
  detail: string;
  art: ImageSourcePropType;
  /** The art's own width over its height. */
  artAspect: number;
  /** The pastel its art's backdrop is matched to (`theme.colors.illustration*`). */
  background: string;
  /** A tag under the title — Daily Trivia's streak — its icon in the accent. */
  badge?: { label: string; icon: LucideIcon };
  onPress: () => void;
  testID: string;
};

/**
 * One game in Fun's grid: its name and a line on it up top, then its
 * illustration running out to the tile's lower-right corner, dissolving into
 * a pastel matched to it, with a chevron beside it. Each game its own colour
 * and art, all one family.
 */
export function GameTile({
  title,
  detail,
  art,
  artAspect,
  background,
  badge,
  onPress,
  testID,
}: GameTileProps) {
  const theme = useTheme();
  const padding = theme.spacing.md;

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={[title, badge?.label, detail].filter(Boolean).join(". ")}
      onPress={onPress}
      style={[styles.tile, { backgroundColor: background, borderRadius: theme.radii.lg, padding }]}
    >
      <Text style={[theme.typography.tileTitle, { color: theme.colors.inkOnLight }]}>{title}</Text>
      {badge && (
        <View style={{ marginTop: theme.spacing.sm }}>
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
        numberOfLines={2}
        style={[
          theme.typography.cardDetail,
          { color: theme.colors.inkOnLightMuted, marginTop: theme.spacing.xs },
        ]}
      >
        {detail}
      </Text>

      <View style={styles.foot}>
        <ChevronBadge />
        <Image
          source={art}
          style={[
            styles.art,
            { aspectRatio: artAspect, marginRight: -padding, marginBottom: -padding },
          ]}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: { flex: 1, overflow: "hidden" },
  // Takes whatever height the row leaves, so the art always sits in the corner.
  foot: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  art: { width: ART_WIDTH },
});
