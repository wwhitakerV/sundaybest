import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import {
  BookOpen,
  Check,
  HandHeart,
  ListChecks,
  Lock,
  MessageCircleQuestionMark,
  ScrollText,
  type LucideIcon,
} from "lucide-react-native";

import { useTheme } from "@/theme";
import type { DayPanelLook, DayStepKey, DayStepLook } from "../logic/day-rail";
import { StudyStepRow } from "./StudyStepRow";

type Theme = ReturnType<typeof useTheme>;

const MARK_SIZE = 12;
const MARK_STROKE = 2.5;
/** Between one step's row and the next. */
const ROW_GAP = 8;
/** How quickly a newly picked day's words ease in, on the surface that stays. */
const CONTENT_FADE_MS = 160;

/** Each step's icon, and the theme's colour and tint for it. */
const STEP_LOOKS = new Map<
  DayStepKey,
  { icon: LucideIcon; colour: (theme: Theme) => string; tint: (theme: Theme) => string }
>([
  [
    "read",
    { icon: BookOpen, colour: (t) => t.colors.stepRead, tint: (t) => t.colors.stepReadTint },
  ],
  [
    "scripture",
    {
      icon: ScrollText,
      colour: (t) => t.colors.stepScripture,
      tint: (t) => t.colors.stepScriptureTint,
    },
  ],
  [
    "reflect",
    {
      icon: MessageCircleQuestionMark,
      colour: (t) => t.colors.stepReflect,
      tint: (t) => t.colors.stepReflectTint,
    },
  ],
  [
    "pray",
    { icon: HandHeart, colour: (t) => t.colors.stepPray, tint: (t) => t.colors.stepPrayTint },
  ],
  [
    "quickCheck",
    {
      icon: ListChecks,
      colour: (t) => t.colors.stepQuickCheck,
      tint: (t) => t.colors.stepQuickCheckTint,
    },
  ],
]);

export type SelectedDayProps = {
  /** Which day it is — when it changes, the new day's words ease in over the surface. */
  contentKey: string;
  title: string;
  /** Its state, and the lines over and under its title (`describeDayPanel`). */
  panel: DayPanelLook;
  /** Its study steps, and its Quick Check if it has one. */
  steps: readonly DayStepLook[];
  onOpenStep: (key: DayStepKey) => void;
  testID: string;
  /** Each step's row is this, then `-` and the step's key. */
  stepTestIDPrefix: string;
};

/**
 * The day picked on Plan Detail, the same shape for every day but set so
 * its state reads before its words do. The day the plan's on sits on a soft
 * surface with its steps on white rows, led in SundayBest red, its title
 * largest. A finished day sits lighter — white, a hairline edge — ticked in
 * green, every step resolved. A locked day has no surface at all, only a
 * hairline, its words muted and its steps locked. Each step keeps its own
 * colour and icon throughout (`StudyStepRow`). Picking another day leaves
 * the surface in place: only its words change, easing in.
 */
export function SelectedDay({
  contentKey,
  title,
  panel,
  steps,
  onOpenStep,
  testID,
  stepTestIDPrefix,
}: SelectedDayProps) {
  const theme = useTheme();
  const { state } = panel;
  const surface =
    state === "today"
      ? theme.colors.surface
      : state === "locked"
        ? "transparent"
        : theme.colors.background;
  const eyebrowInk =
    state === "today"
      ? theme.colors.accent
      : state === "done"
        ? theme.colors.correct
        : theme.colors.textMuted;
  const muted = state === "locked";

  return (
    <View
      testID={testID}
      style={[
        styles.day,
        state !== "today" && styles.edged,
        {
          backgroundColor: surface,
          borderColor: theme.colors.hairline,
          borderRadius: theme.radii.xl,
        },
      ]}
    >
      {/* The surface stays; only what's on it changes, a newly picked day's
      words easing in (keyed by day). */}
      <Animated.View
        key={contentKey}
        entering={FadeIn.duration(CONTENT_FADE_MS)}
        style={styles.content}
      >
        <View>
          <View style={styles.eyebrow}>
            {/* Lucide keeps its own testID from React Native, so these carry it. */}
            {state === "done" && (
              <View testID={`${testID}-check`}>
                <Check size={MARK_SIZE} color={eyebrowInk} strokeWidth={MARK_STROKE} />
              </View>
            )}
            {state === "locked" && (
              <View testID={`${testID}-lock`}>
                <Lock size={MARK_SIZE} color={eyebrowInk} strokeWidth={theme.icon.strokeWidth} />
              </View>
            )}
            <Text style={[theme.typography.metaLabel, styles.eyebrowText, { color: eyebrowInk }]}>
              {panel.eyebrow}
            </Text>
          </View>
          <Text
            accessibilityRole="header"
            style={[
              state === "today"
                ? theme.typography.editorialTitle
                : theme.typography.editorialHeading,
              styles.title,
              { color: muted ? theme.colors.textMuted : theme.colors.text },
            ]}
          >
            {title}
          </Text>
          <Text style={[theme.typography.label, { color: theme.colors.textMuted }]}>
            {panel.meta}
          </Text>
        </View>

        <View style={styles.steps}>
          {steps.map((step) => {
            const look = STEP_LOOKS.get(step.key);
            return (
              <StudyStepRow
                key={step.key}
                testID={`${stepTestIDPrefix}-${step.key}`}
                look={step}
                icon={look?.icon ?? BookOpen}
                colour={look?.colour(theme) ?? theme.colors.text}
                tint={look?.tint(theme) ?? theme.colors.surface}
                raised={state === "today"}
                onPress={() => onOpenStep(step.key)}
              />
            );
          })}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  // A little more room above than around, for the heading to settle into.
  day: { paddingTop: 24, paddingHorizontal: 16, paddingBottom: 16 },
  edged: { borderWidth: 1 },
  content: { gap: 20 },
  eyebrow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  eyebrowText: { textTransform: "uppercase", letterSpacing: 1 },
  title: { marginBottom: 6 },
  steps: { gap: ROW_GAP },
});
