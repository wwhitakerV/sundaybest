import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { Link, type Href } from "expo-router";
import Animated, { type AnimatedStyle } from "react-native-reanimated";
import { BookOpen, Lock } from "lucide-react-native";

import { radius, space, useTheme } from "@/theme";
import { CompactButton } from "@/ui/atoms/CompactButton";
import { RoundedEdge } from "@/ui/atoms/RoundedEdge";
import { VideoThumbnail } from "@/ui/atoms/VideoThumbnail";
import { PAGE_INSET } from "@/ui/organisms/Screen";
import { SFProBody } from "@/ui/typography/SFProBody";
import { BAR_ROW_HEIGHT, BAR_THUMB } from "../hooks/use-study-scroll";

type AnimatedViewStyle = StyleProp<AnimatedStyle<ViewStyle>>;

/** The arch of the bar's foot: the page scrolls up into a rounded window, as into a frame. */
const FRAME_RADIUS = radius[28];

export type StudyBarProps = {
  study: {
    title: string;
    /** "Day 2". */
    day: string;
    thumbnailUrl: string | null;
    waiting: boolean;
  };
  /** The status bar's height — the bar runs up behind it, white. */
  topInset: number;
  /** How far in it's come (from the scroll), and its thumbnail — shown once the artwork has flown into it. */
  style: AnimatedViewStyle;
  thumbStyle: AnimatedViewStyle;
  /** Not while it's still coming in. */
  touchable: boolean;
  /** The plan — its thumbnail zooms into it. */
  href: Href;
  onContinue: () => void;
};

/**
 * The featured study, once it's scrolled away: a white bar pinned to the top
 * of Home, up behind the status bar — the study's thumbnail, title and day,
 * and a book button to carry on with today — its foot arched at both sides
 * (`RoundedEdge`), so the page scrolls up into a rounded window as into a
 * frame. The bar opens the plan, its thumbnail the source of the zoom.
 */
export function StudyBar({
  study,
  topInset,
  style,
  thumbStyle,
  touchable,
  href,
  onContinue,
}: StudyBarProps) {
  const theme = useTheme();
  return (
    <Animated.View
      testID="home-tab-plan-bar"
      pointerEvents={touchable ? "box-none" : "none"}
      style={[styles.bar, style]}
    >
      <View style={{ paddingTop: topInset, backgroundColor: theme.colors.background }}>
        <View style={styles.row}>
          <Link href={href} asChild>
            <Pressable
              testID="home-tab-plan-bar-open"
              accessibilityRole="button"
              accessibilityLabel={`${study.title}, ${study.day}`}
              accessibilityHint="Opens the plan"
              style={styles.open}
            >
              <Link.AppleZoom>
                <View collapsable={false} style={styles.zoomSource}>
                  <Animated.View testID="home-tab-plan-bar-thumbnail" style={thumbStyle}>
                    <VideoThumbnail uri={study.thumbnailUrl} style={styles.thumbnail} />
                  </Animated.View>
                </View>
              </Link.AppleZoom>
              <View style={styles.words}>
                <SFProBody variant="listItem" numberOfLines={1}>
                  {study.title}
                </SFProBody>
                <SFProBody variant="detail" tone="textSupporting">
                  {study.day}
                </SFProBody>
              </View>
            </Pressable>
          </Link>
          <CompactButton
            testID="home-tab-plan-bar-continue"
            label={study.waiting ? `${study.day} tomorrow` : `Continue ${study.day}`}
            icon={study.waiting ? Lock : BookOpen}
            iconOnly
            tone={study.waiting ? "waiting" : "dark"}
            onPress={onContinue}
          />
        </View>
      </View>
      <RoundedEdge radius={FRAME_RADIUS} inset={0} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bar: { position: "absolute", top: 0, left: 0, right: 0 },
  row: {
    height: BAR_ROW_HEIGHT,
    paddingHorizontal: PAGE_INSET,
    flexDirection: "row",
    alignItems: "center",
    gap: space[14],
  },
  open: { flex: 1, flexDirection: "row", alignItems: "center", gap: space[14] },
  zoomSource: { borderRadius: BAR_THUMB.radius },
  thumbnail: { width: BAR_THUMB.width, height: BAR_THUMB.height, borderRadius: BAR_THUMB.radius },
  words: { flex: 1, gap: space[2] },
});
