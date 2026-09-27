import { Pressable, StyleSheet, Text, View } from "react-native";
import { BookOpen, Check } from "lucide-react-native";

import { CompactButton } from "@/ui/CompactButton";
import { GradientBackdrop } from "@/ui/GradientBackdrop";
import { VideoThumbnail } from "@/ui/VideoThumbnail";
import { useTheme } from "@/theme";
import { getBackdropStops } from "@/utils/color/getBackdropStops";
import { prefersLightInk } from "@/utils/color/prefersLightInk";
import type { LibraryPlanLook } from "../logic/library";

/** A little taller than wide — 9:12 — as Apple's Podcasts shows what's up next. */
const CARD_ASPECT = 3 / 4;
const CARD_PADDING = 20;
/** The artwork's share of the card's width, centred with room to breathe. */
const ARTWORK_WIDTH = "78%";
const TITLE_LINES = 3;

export type LibraryPlanCardProps = {
  title: string;
  thumbnailUrl: string | null;
  /** The sermon's colours, strongest first; empty until known. */
  colors: readonly string[];
  look: LibraryPlanLook;
  /** Opens the plan. */
  onPress: () => void;
  /** Its button: continues, starts, or reviews the plan (`getLibraryPlanActionHref`). */
  onAction: () => void;
  testID: string;
  /** Its button's. */
  actionTestID: string;
};

/**
 * One plan in the library, the page's full width, the way Apple's Podcasts
 * shows what's up next: 3:4, in a gradient of its sermon's own colours, with
 * the sermon's thumbnail centred up top and, at its foot, where it stands,
 * its title, and a button — continuing it, starting it, or reviewing it. Its
 * type is white on a dark colour and black on a light one. The card opens
 * the plan.
 */
export function LibraryPlanCard({
  title,
  thumbnailUrl,
  colors,
  look,
  onPress,
  onAction,
  testID,
  actionTestID,
}: LibraryPlanCardProps) {
  const theme = useTheme();
  const colour = colors.at(0) ?? theme.colors.featureBackdrop;
  const light = prefersLightInk(colour);
  const ink = light ? theme.colors.inkOnDark : theme.colors.inkOnLight;
  const muted = light ? theme.colors.inkOnDarkMuted : theme.colors.inkOnLightMuted;

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${look.summary}`}
      accessibilityHint="Opens the plan"
      // Its button, for VoiceOver — which reads the card as one.
      accessibilityActions={[{ name: "action", label: look.action }]}
      onAccessibilityAction={({ nativeEvent }) => {
        if (nativeEvent.actionName === "action") onAction();
      }}
      onPress={onPress}
      style={[styles.card, { backgroundColor: colour, borderRadius: theme.radii.xl }]}
    >
      <GradientBackdrop stops={getBackdropStops(colors, theme.colors.featureBackdrop)} />

      <View style={styles.artworkArea}>
        <View
          style={[
            styles.artwork,
            theme.elevation.card,
            { shadowColor: theme.colors.shadow, borderRadius: theme.radii.md },
          ]}
        >
          <VideoThumbnail uri={thumbnailUrl} style={{ borderRadius: theme.radii.md }} />
        </View>
      </View>

      <View style={styles.words}>
        <Text numberOfLines={1} style={[theme.typography.metaLabel, { color: muted }]}>
          {look.summary}
        </Text>
        <Text numberOfLines={TITLE_LINES} style={[theme.typography.cardTitle, { color: ink }]}>
          {title}
        </Text>
      </View>

      <CompactButton
        testID={actionTestID}
        label={look.action}
        icon={look.done ? Check : BookOpen}
        tone={light ? "light" : "dark"}
        align="start"
        onPress={onAction}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { width: "100%", aspectRatio: CARD_ASPECT, padding: CARD_PADDING, overflow: "hidden" },
  // The artwork, centred in the room its words leave.
  artworkArea: { flex: 1, justifyContent: "center", alignItems: "center" },
  artwork: { width: ARTWORK_WIDTH },
  words: { gap: 6, marginBottom: 16 },
});
