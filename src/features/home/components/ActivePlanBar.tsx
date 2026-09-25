import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { Link, type Href } from "expo-router";
import Animated, { type AnimatedStyle } from "react-native-reanimated";
import { BookOpen } from "lucide-react-native";

import { CompactButton } from "@/ui/CompactButton";
import { GradientBackdrop } from "@/ui/GradientBackdrop";
import { PAGE_INSET } from "@/ui/Screen";
import { VideoThumbnail } from "@/ui/VideoThumbnail";
import { useTheme } from "@/theme";
import { getBackdropStops } from "@/utils/color/getBackdropStops";
import { prefersLightInk } from "@/utils/color/prefersLightInk";
import { BAR_ROW_HEIGHT, BAR_THUMB_RADIUS, BAR_THUMB_WIDTH } from "../logic/hero-collapse";

export type ActivePlanBarProps = {
  title: string;
  /** "Day 2". */
  day: string;
  thumbnailUrl: string | null;
  /** The sermon's colours, strongest first; empty until known. */
  colors: readonly string[];
  /** The status bar's height — the bar runs up behind it. */
  topInset: number;
  /** Whether it takes taps — not while it's still coming in. */
  touchable: boolean;
  /** How far in it's come — its opacity, driven by the scroll. */
  style?: StyleProp<AnimatedStyle<ViewStyle>>;
  /** Its thumbnail — hidden until the hero's artwork has flown into its place. */
  thumbStyle?: StyleProp<AnimatedStyle<ViewStyle>>;
  /** Plan Detail — the bar's thumbnail zooms into it. */
  href: Href;
  onContinue: () => void;
};

/**
 * The featured plan, collapsed: a full-bleed bar pinned to the top of Home,
 * in the sermon's gradient, up behind the status bar — its thumbnail, title
 * and day, and a book button to carry on with today's study. The bar itself
 * opens the plan, its thumbnail the source of the zoom into Plan Detail (as
 * the featured plan's artwork is). It comes in as the featured plan scrolls
 * away, the artwork flying up into its thumbnail.
 */
export function ActivePlanBar({
  title,
  day,
  thumbnailUrl,
  colors,
  topInset,
  touchable,
  style,
  thumbStyle,
  href,
  onContinue,
}: ActivePlanBarProps) {
  const theme = useTheme();
  const colour = colors.at(0) ?? theme.colors.featureBackdrop;
  const light = prefersLightInk(colour);

  return (
    <Animated.View
      testID="home-tab-plan-bar"
      pointerEvents={touchable ? "auto" : "none"}
      style={[styles.bar, { paddingTop: topInset, backgroundColor: colour }, style]}
    >
      <GradientBackdrop stops={getBackdropStops(colors, theme.colors.featureBackdrop)} />
      <View style={styles.row}>
        <Link href={href} asChild>
          <Pressable
            testID="home-tab-plan-bar-open"
            accessibilityRole="button"
            accessibilityLabel={`${title}, ${day}`}
            accessibilityHint="Opens the plan"
            style={styles.open}
          >
            <Link.AppleZoom>
              {/* Shape only, a single style object — as the hero's zoom source. */}
              <View collapsable={false} style={styles.zoomSource}>
                <Animated.View testID="home-tab-plan-bar-thumbnail" style={thumbStyle}>
                  <VideoThumbnail uri={thumbnailUrl} style={styles.thumbnail} />
                </Animated.View>
              </View>
            </Link.AppleZoom>
            <View style={styles.words}>
              <Text
                numberOfLines={1}
                style={[
                  theme.typography.listItem,
                  { color: light ? theme.colors.inkOnDark : theme.colors.inkOnLight },
                ]}
              >
                {title}
              </Text>
              <Text
                style={[
                  theme.typography.body,
                  { color: light ? theme.colors.inkOnDarkMuted : theme.colors.inkOnLightMuted },
                ]}
              >
                {day}
              </Text>
            </View>
          </Pressable>
        </Link>
        <CompactButton
          testID="home-tab-plan-bar-continue"
          label={`Continue ${day}`}
          icon={BookOpen}
          iconOnly
          tone={light ? "light" : "dark"}
          onPress={onContinue}
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bar: { position: "absolute", top: 0, left: 0, right: 0, overflow: "hidden" },
  row: {
    height: BAR_ROW_HEIGHT,
    paddingHorizontal: PAGE_INSET,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  open: { flex: 1, flexDirection: "row", alignItems: "center", gap: 14 },
  zoomSource: { borderRadius: BAR_THUMB_RADIUS },
  thumbnail: { width: BAR_THUMB_WIDTH, borderRadius: BAR_THUMB_RADIUS },
  words: { flex: 1, gap: 2 },
});
