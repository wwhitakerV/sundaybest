import type { ReactNode, RefObject } from "react";
import {
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated, { type AnimatedStyle } from "react-native-reanimated";

import { radius, space } from "@/theme";
import { Button } from "@/ui/atoms/Button";
import { VideoThumbnail } from "@/ui/atoms/VideoThumbnail";
import { MonoLabel } from "@/ui/typography/MonoLabel";
import { SerifTitle } from "@/ui/typography/SerifTitle";
import { SFProBody } from "@/ui/typography/SFProBody";

/** The sermon's artwork: its corners softened, never a card round it. */
export const FEATURE_ARTWORK_RADIUS = radius[16];

/** A plan, featured: what it's called, where it stands, and the way on. */
type FeaturedPlan = {
  title: string;
  /** The series its sermon is from, and which part, under its title ("Unshakable · Part II"); none when it names none. */
  series?: string | null;
  /** The church whose sermon it is — none when the sermon doesn't say. */
  church: string | null;
  thumbnailUrl: string | null;
  /** What it is, at the left ("IN PROGRESS"). */
  label: string;
  /** How far, opposite ("DAY 2 OF 7"). */
  standing: string;
  /** Today's study and how long it takes ("Today: Clothed With Power · 9 min"). */
  today: string;
  /** The way on: "Continue Day 2", or "Day 3 tomorrow" while it waits. */
  action: string;
  waiting: boolean;
};

/** One part of it as the page moves it: where it's measured from, and how it moves. */
export type FeaturePart = {
  ref?: RefObject<View | null>;
  /** Its place in the feature, as laid out. */
  onLayout?: (event: LayoutChangeEvent) => void;
  style?: StyleProp<AnimatedStyle<ViewStyle>>;
};

export type PlanFeatureProps = {
  plan: FeaturedPlan;
  onContinue: () => void;
  /** The artwork as the page sets it — a link into the plan, held back as it scrolls (Home's). */
  frameArtwork?: (artwork: ReactNode) => ReactNode;
  words?: FeaturePart;
  /** Continue, and whether it's here to press — not while it's handed over to the tab bar. */
  action?: FeaturePart & { shown?: boolean };
  testIDs: { root: string; title: string; standing: string; today: string; action: string };
};

/**
 * A plan featured as a publication would — Home's study under way, and each
 * of Plans' pages: the sermon's 16:9 artwork alone on the white page, no
 * backdrop, wash or overlay; a restrained label with where it stands
 * opposite; the plan's title large in Canela, its church under it; today's
 * study and its minutes quietly in Söhne; and Continue, black and full width,
 * under it all. Each page moves its parts as it scrolls (`words`, `action`).
 */
export function PlanFeature({
  plan,
  onContinue,
  frameArtwork,
  words,
  action,
  testIDs,
}: PlanFeatureProps) {
  const artwork = <VideoThumbnail uri={plan.thumbnailUrl} style={styles.artwork} />;
  const actionShown = action?.shown ?? true;

  return (
    <View testID={testIDs.root} style={styles.feature}>
      {frameArtwork ? frameArtwork(artwork) : artwork}

      <Animated.View onLayout={words?.onLayout} style={words?.style}>
        <View ref={words?.ref} collapsable={false} style={styles.words}>
          <View style={styles.labels}>
            <MonoLabel variant="labelTracked" tone="textSupporting">
              {plan.label}
            </MonoLabel>
            <MonoLabel variant="labelTracked" tone="textSupporting" testID={testIDs.standing}>
              {plan.standing}
            </MonoLabel>
          </View>
          <View style={styles.titled}>
            <SerifTitle variant="feature" accessibilityRole="header" testID={testIDs.title}>
              {plan.title}
            </SerifTitle>
            {plan.series && (
              <SFProBody variant="rowDetail" tone="textSupporting">
                {plan.series}
              </SFProBody>
            )}
            {plan.church && (
              <SFProBody variant="rowDetail" tone="textSupporting">
                {plan.church}
              </SFProBody>
            )}
          </View>
          <SFProBody variant="rowDetail" tone="textSupporting" testID={testIDs.today}>
            {plan.today}
          </SFProBody>
        </View>
      </Animated.View>

      <Animated.View
        onLayout={action?.onLayout}
        pointerEvents={actionShown ? "auto" : "none"}
        accessibilityElementsHidden={!actionShown}
        style={action?.style}
      >
        <View ref={action?.ref} collapsable={false}>
          <Button
            testID={testIDs.action}
            label={plan.action}
            variant={plan.waiting ? "waiting" : "primary"}
            onPress={onContinue}
          />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  feature: { gap: space[24] },
  artwork: { width: "100%", aspectRatio: 16 / 9, borderRadius: FEATURE_ARTWORK_RADIUS },
  words: { gap: space[12] },
  labels: { flexDirection: "row", justifyContent: "space-between", gap: space[12] },
  titled: { gap: space[4] },
});
