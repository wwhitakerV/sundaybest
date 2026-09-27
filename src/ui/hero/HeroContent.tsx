import {
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated, { type AnimatedStyle } from "react-native-reanimated";
import { BookOpen } from "lucide-react-native";

import { useTheme } from "@/theme";
import { CompactButton } from "../CompactButton";
import { StepProgress } from "../StepProgress";

const HALO_RADIUS = 12;
/**
 * Grouped, not even: the plan's name (status, title, church) set close;
 * Continue apart from it with what today holds tight under it, as its
 * caption; and the day-by-day line well apart, a thing of its own.
 */
const STATUS_TO_TITLE_EXTRA = 2;
const NAME_TO_CONTINUE = 24;
const CONTINUE_TO_TODAY = 10;
const TODAY_TO_PROGRESS = 28;

type HeroContentTestIDs = {
  continueButton: string;
  content?: string;
  status?: string;
  title?: string;
  today?: string;
  progress?: string;
};

export type HeroContentProps = {
  title: string;
  church: string | null;
  /** Where the plan stands, the way on, and what today holds. */
  words: { status: string; action: string; today: string };
  totalDays: number;
  completedDayCount: number;
  /** Whether it sits on a dark colour, so its type is white; black on a light one. */
  light: boolean;
  onContinue: () => void;
  /** Continue as it hands over elsewhere and back. */
  continueStyle?: StyleProp<AnimatedStyle<ViewStyle>>;
  /** Whether Continue's here to press — not while it's handed over. Shown unless said. */
  continueShown?: boolean;
  /** Reports where Continue sits in it. */
  onContinueLayout?: (event: LayoutChangeEvent) => void;
  /** Whether it ends on the day-by-day line — not on a page that shows the days itself. Shown unless said. */
  showProgress?: boolean;
  testIDs: HeroContentTestIDs;
  /** Its placement in the hero. */
  style?: StyleProp<ViewStyle>;
};

/**
 * A feature hero's words — where the plan stands, its title and church,
 * Continue, what today holds, and the day-by-day line — on a soft shadow,
 * white on a dark colour and black on a light one. The same on Home's plan
 * under way and on Plan Detail; each hero places it and moves it its own way.
 */
export function HeroContent({
  title,
  church,
  words,
  totalDays,
  completedDayCount,
  light,
  onContinue,
  continueStyle,
  continueShown = true,
  onContinueLayout,
  showProgress = true,
  testIDs,
  style,
}: HeroContentProps) {
  const theme = useTheme();
  const ink = light ? theme.colors.inkOnDark : theme.colors.inkOnLight;
  const muted = light ? theme.colors.inkOnDarkMuted : theme.colors.inkOnLightMuted;
  const halo = {
    textShadowColor: light ? theme.colors.inkHaloOnDark : theme.colors.inkHaloOnLight,
    textShadowRadius: HALO_RADIUS,
  };

  return (
    <View testID={testIDs.content} style={style}>
      <View style={styles.words}>
        <Text
          testID={testIDs.status}
          style={[theme.typography.metaLabel, styles.status, halo, { color: muted }]}
        >
          {words.status}
        </Text>
        <Text
          testID={testIDs.title}
          accessibilityRole="header"
          style={[theme.typography.headline, styles.centred, halo, { color: ink }]}
        >
          {title}
        </Text>
        {church && (
          <Text style={[theme.typography.body, styles.centred, halo, { color: muted }]}>
            {church}
          </Text>
        )}
      </View>

      <Animated.View
        testID={`${testIDs.continueButton}-slot`}
        onLayout={onContinueLayout}
        pointerEvents={continueShown ? "auto" : "none"}
        style={[styles.action, continueStyle]}
      >
        <CompactButton
          testID={testIDs.continueButton}
          label={words.action}
          icon={BookOpen}
          tone={light ? "light" : "dark"}
          onPress={onContinue}
        />
      </Animated.View>

      <Text
        testID={testIDs.today}
        style={[
          theme.typography.body,
          styles.centred,
          showProgress && styles.today,
          { color: muted },
        ]}
      >
        {words.today}
      </Text>
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
  words: { alignItems: "center", gap: 6 },
  status: { letterSpacing: 1, marginBottom: STATUS_TO_TITLE_EXTRA },
  action: { marginTop: NAME_TO_CONTINUE, marginBottom: CONTINUE_TO_TODAY },
  today: { marginBottom: TODAY_TO_PROGRESS },
  centred: { textAlign: "center" },
});
