import { StyleSheet, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import {
  BookOpen,
  HandHeart,
  MessageCircleQuestionMark,
  ScrollText,
  type LucideIcon,
} from "lucide-react-native";

import type { StudyStep } from "@/types/domain";
import { space, useTheme } from "@/theme";
import type { DayHeaderLook, DayStepKey, QuickCheckLook, StudyStepLook } from "../logic/day-rail";
import { QuickCheckFollowUp } from "./QuickCheckFollowUp";
import { STEP_ROW_INSET } from "../logic/step-sequence";
import { StudyStepRow } from "./StudyStepRow";
import { SFProBody } from "@/ui/typography/SFProBody";
import { SerifTitle } from "@/ui/typography/SerifTitle";

/** How quickly a newly picked day's words ease in, in the place that stays. */
const CONTENT_FADE_MS = 160;
/** Between the header and the first step's row (which has room of its own above). */
const HEADER_SPACE = space[12];
/** Between the last step's row and the rule over the Quick Check. */
const FOLLOW_UP_SPACE = space[8];

/** Each study step's icon, the same ink for all: where it stands is what colours it. */
function stepIcon(key: StudyStep): LucideIcon {
  switch (key) {
    case "read":
      return BookOpen;
    case "scripture":
      return ScrollText;
    case "reflect":
      return MessageCircleQuestionMark;
    case "pray":
      return HandHeart;
  }
}

export type SelectedDayProps = {
  /** Which day it is — when it changes, the new day's words ease in. */
  contentKey: string;
  title: string;
  /** Whether it's locked, and the line under its title (`describeDayHeader`). */
  header: DayHeaderLook;
  /** Its four study steps, in order. */
  steps: readonly StudyStepLook[];
  /** Its Quick Check, for after the study — none if it hasn't one. */
  quickCheck: QuickCheckLook | null;
  onOpenStep: (key: DayStepKey) => void;
  testID: string;
  /** Each step's row is this, then `-` and the step's key. */
  stepTestIDPrefix: string;
};

/**
 * The day picked on Plan Detail, as one study journey set straight on the
 * page — no card round it. Which day it is, the row of days above says; this
 * says what the day holds: its title, how long it takes and how far through
 * it is, then its four steps down one line (`StudyStepRow`) — done ones
 * receding, the step you're on the one thing that stands out, those to come
 * neutral — and, ruled off after them, its Quick Check (`QuickCheckFollowUp`).
 * There's no Continue here: the page has one. Picking another day leaves it
 * in place: only its words change, easing in.
 */
export function SelectedDay({
  contentKey,
  title,
  header,
  steps,
  quickCheck,
  onOpenStep,
  testID,
  stepTestIDPrefix,
}: SelectedDayProps) {
  const theme = useTheme();

  return (
    <View testID={testID}>
      {/* It stays; only what's in it changes, a newly picked day's words
      easing in (keyed by day). */}
      <Animated.View key={contentKey} entering={FadeIn.duration(CONTENT_FADE_MS)}>
        <View style={styles.header}>
          <SerifTitle
            variant="title"
            tone={header.locked ? "textMuted" : "text"}
            accessibilityRole="header"
          >
            {title}
          </SerifTitle>
          <SFProBody variant="label" tone="textMuted">
            {header.meta}
          </SFProBody>
        </View>

        {/* Reaching into the page's inset (which must be at least
        `STEP_ROW_INSET`), so the marks line up under the title. No gap
        between rows: each draws its own length of the line, meeting the next. */}
        <View testID={`${testID}-steps`} style={styles.bleed}>
          {steps.map((step, index) => (
            <StudyStepRow
              key={step.key}
              testID={`${stepTestIDPrefix}-${step.key}`}
              look={step}
              icon={stepIcon(step.key)}
              joinsPrevious={index > 0}
              joinsNext={index < steps.length - 1}
              onPress={() => onOpenStep(step.key)}
            />
          ))}
        </View>

        {quickCheck && (
          <View
            testID={`${testID}-follow-up`}
            style={[styles.followUp, { borderTopColor: theme.colors.divider }]}
          >
            <View style={styles.bleed}>
              <QuickCheckFollowUp
                testID={`${stepTestIDPrefix}-${quickCheck.key}`}
                look={quickCheck}
                onPress={() => onOpenStep(quickCheck.key)}
              />
            </View>
          </View>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { gap: space[6], marginBottom: HEADER_SPACE },
  bleed: { marginHorizontal: -STEP_ROW_INSET },
  followUp: { marginTop: FOLLOW_UP_SPACE, borderTopWidth: 1 },
});
