import {
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated, { type AnimatedStyle } from "react-native-reanimated";
import { BookOpen } from "lucide-react-native";

import { space, useTheme } from "@/theme";
import { CompactButton } from "@/ui/atoms/CompactButton";
import { StepProgress } from "@/ui/atoms/StepProgress";
import { MonoLabel } from "@/ui/typography/MonoLabel";
import { SFProTitle } from "@/ui/typography/SFProTitle";
import { SFProBody } from "@/ui/typography/SFProBody";

const HALO_RADIUS = 12;
/**
 * Grouped, not even: the plan's name (status, title, church) set close;
 * Continue apart from it with what today holds tight under it, as its
 * caption; and the day-by-day line well apart, a thing of its own.
 */
const STATUS_TO_TITLE_EXTRA = 2;
const NAME_TO_CONTINUE = space[24];
const CONTINUE_TO_TODAY = space[10];
const TODAY_TO_PROGRESS = space[28];

type HeroContentTestIDs = {
  continueButton: string;
  content?: string;
  status?: string;
  title?: string;
  today?: string;
  progress?: string;
};

/** What a hero says about its plan. */
export type HeroPlan = {
  title: string;
  church: string | null;
  /** Where the plan stands, the way on, and what today holds. */
  words: { status: string; action: string; today: string };
  totalDays: number;
  completedDayCount: number;
};

/** Continue as it hands over elsewhere and back. */
export type ContinueHandOver = {
  style?: StyleProp<AnimatedStyle<ViewStyle>>;
  /** Whether Continue's here to press — not while it's handed over. */
  shown: boolean;
  /** Reports where Continue sits in it. */
  onLayout: (event: LayoutChangeEvent) => void;
};

export type HeroContentProps = {
  plan: HeroPlan;
  /** Whether it sits on a dark colour, so its type is white; black on a light one. */
  light: boolean;
  onContinue: () => void;
  /** Only where Continue hands over; otherwise it's always here to press. */
  continueHandOver?: ContinueHandOver;
  /** Whether it ends on the day-by-day line — not on a page that shows the days itself. Hidden unless said. */
  showProgress?: boolean;
  testIDs: HeroContentTestIDs;
  /** Its placement in the hero. */
  style?: StyleProp<ViewStyle>;
};

/**
 * A plan hero's words — where the plan stands, its title and church,
 * Continue, what today holds, and the day-by-day line — on a soft shadow,
 * white on a dark colour and black on a light one. The same on Home's plan
 * under way and on Plan Detail; each hero places it and moves it its own way.
 */
export function HeroContent({
  plan,
  light,
  onContinue,
  continueHandOver,
  showProgress = false,
  testIDs,
  style,
}: HeroContentProps) {
  const theme = useTheme();
  const { title, church, words, totalDays, completedDayCount } = plan;
  const continueShown = continueHandOver?.shown ?? true;
  const ink = light ? "inkOnDark" : "inkOnLight";
  const muted = light ? "inkOnDarkMuted" : "inkOnLightMuted";
  const halo = {
    textShadowColor: light ? theme.colors.inkHaloOnDark : theme.colors.inkHaloOnLight,
    textShadowRadius: HALO_RADIUS,
  };

  return (
    <View testID={testIDs.content} style={style}>
      <View style={styles.words}>
        <MonoLabel
          testID={testIDs.status}
          variant="labelTracked"
          tone={muted}
          style={[styles.status, halo]}
        >
          {words.status}
        </MonoLabel>
        <SFProTitle
          testID={testIDs.title}
          accessibilityRole="header"
          variant="headline"
          tone={ink}
          style={[styles.centred, halo]}
        >
          {title}
        </SFProTitle>
        {church && (
          <SFProBody tone={muted} style={[styles.centred, halo]}>
            {church}
          </SFProBody>
        )}
      </View>

      <Animated.View
        testID={`${testIDs.continueButton}-slot`}
        onLayout={continueHandOver?.onLayout}
        pointerEvents={continueShown ? "auto" : "none"}
        style={[styles.action, continueHandOver?.style]}
      >
        <CompactButton
          testID={testIDs.continueButton}
          label={words.action}
          icon={BookOpen}
          tone={light ? "light" : "dark"}
          onPress={onContinue}
        />
      </Animated.View>

      <SFProBody
        testID={testIDs.today}
        tone={muted}
        style={[styles.centred, showProgress && styles.today]}
      >
        {words.today}
      </SFProBody>
      {showProgress && (
        <View accessible accessibilityLabel={`${completedDayCount} of ${totalDays} days done`}>
          <StepProgress
            {...(testIDs.progress !== undefined && { testID: testIDs.progress })}
            steps={totalDays}
            // Days are done in order, so the first not yet done is the active segment.
            activeIndex={completedDayCount}
            ink={light ? "light" : "dark"}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  words: { alignItems: "center", gap: space[6] },
  status: { marginBottom: STATUS_TO_TITLE_EXTRA },
  action: { marginTop: NAME_TO_CONTINUE, marginBottom: CONTINUE_TO_TODAY },
  today: { marginBottom: TODAY_TO_PROGRESS },
  centred: { textAlign: "center" },
});
