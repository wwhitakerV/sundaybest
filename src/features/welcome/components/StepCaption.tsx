import { useState } from "react";
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import Animated from "react-native-reanimated";

import { StreakBurst } from "@/ui/burst/StreakBurst";
import { useTheme } from "@/theme";
import { makeRadialStreaks } from "@/utils/burst/makeRadialStreaks";
import { useSpringIn } from "../hooks/use-spring-in";
import type { CaptionState } from "../logic/story";
import { WELCOME_STEPS } from "./welcome-steps";

const ICON_SIZE = 18;
/** Clear space between the line's ends and where each burst fires from. */
const BURST_GAP = 8;

// Each end fires a small fan straight out to its side.
const BURST = { count: 5, spreadDeg: 60, reach: 28, length: 9, shortRatio: 0.6 } as const;
const LEFT_STREAKS = makeRadialStreaks({ ...BURST, centerDeg: -90 });
const RIGHT_STREAKS = makeRadialStreaks({ ...BURST, centerDeg: 90 });

type Shown = { step: number; word: number | null };

export type StepCaptionProps = {
  caption: CaptionState;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/**
 * The how-it-works step for the screen on the phone, right under its lifted
 * UI. Each time a new step takes over, the line springs out — fading in from
 * small, overshooting, settling — as a burst of streaks fires straight out
 * from each end, level with the middle of the text, as if the line had been
 * spat out between them. Within step 3, each new item picked out fires the
 * bursts again while the line itself stays put. For step 3 the item
 * on screen is picked out in SundayBest red, the rest black. It fades away
 * between turns.
 */
export function StepCaption({ caption, style, testID }: StepCaptionProps) {
  const theme = useTheme();

  // Keep showing the last step while fading out, rather than flipping to another.
  const [shown, setShown] = useState<Shown | null>(null);
  if (caption.mode === "step" && (shown?.step !== caption.step || shown.word !== caption.word)) {
    setShown({ step: caption.step, word: caption.word });
  }

  // The line springs in once per step; the bursts fire on every change —
  // including each new item of step 3 being picked out, while the line stays.
  const stepKey = caption.mode === "step" ? `${caption.step}` : null;
  const burstKey = caption.mode === "step" ? `${caption.step}:${caption.word ?? "-"}` : null;
  const springStyle = useSpringIn(stepKey);
  const step = shown ? WELCOME_STEPS.at(shown.step) : undefined;
  if (!step || !shown) return null;
  const { Icon } = step;

  return (
    <View testID={testID} style={[styles.row, style]}>
      {/* The line at rest sets where the bursts fire from; it springs inside. */}
      <View style={styles.line}>
        {/* Each burst's origin sits in a full-height column that centres it
            vertically on the line — flex centring, not a percentage offset —
            just off that end of the text. */}
        <View pointerEvents="none" style={[styles.burstColumn, styles.leftColumn]}>
          <StreakBurst
            trigger={burstKey}
            streaks={LEFT_STREAKS}
            style={styles.origin}
            {...(testID && { testID: `${testID}-burst-left` })}
          />
        </View>
        <Animated.View style={[styles.content, springStyle]}>
          <Icon size={ICON_SIZE} color={theme.colors.text} strokeWidth={1.75} />
          <Text style={[theme.typography.listItem, { color: theme.colors.text }]}>
            {step.parts.map(({ lead, item }, index) => (
              <Text key={item}>
                {lead}
                <Text
                  // The item on screen (step 3's read / reflect / pray / quiz)
                  // in SundayBest red; everything else — commas included —
                  // stays black.
                  style={{ color: shown.word === index ? theme.colors.accent : theme.colors.text }}
                >
                  {item}
                </Text>
              </Text>
            ))}
          </Text>
        </Animated.View>
        <View pointerEvents="none" style={[styles.burstColumn, styles.rightColumn]}>
          <StreakBurst
            trigger={burstKey}
            streaks={RIGHT_STREAKS}
            style={styles.origin}
            {...(testID && { testID: `${testID}-burst-right` })}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  line: { justifyContent: "center" },
  content: { flexDirection: "row", alignItems: "center", gap: 10 },
  burstColumn: { position: "absolute", top: 0, bottom: 0, width: 0, justifyContent: "center" },
  leftColumn: { left: -BURST_GAP },
  rightColumn: { right: -BURST_GAP },
  // A zero-size point in the column's flow, so the column's centring places it.
  origin: { position: "relative" },
});
