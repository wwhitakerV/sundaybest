import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

import { controlHeight, motion, space } from "@/theme";
import { FLOATING_NAV_BAR } from "@/ui/organisms/floatingNavBar";
import { PAGE_INSET } from "@/ui/organisms/Screen";
import { SFProBody } from "@/ui/typography/SFProBody";
import { useRibbon } from "../hooks/use-ribbon";
import { OFFER_AT } from "../logic/welcome-timing";
import { reached, type WelcomePhase } from "../hooks/use-welcome-entrance";
import { BeginButton } from "./BeginButton";
import { RibbonText } from "./RibbonText";
import { SamplePlansSheet, type SamplePlan } from "./SamplePlansSheet";

/** What SundayBest does, set a size under what a day of it holds — written out in that order. */
const WRITTEN = [
  "Turn the sermons you love into daily Bible studies.",
  "Read the teaching. Explore the Scripture. Reflect on what matters. Make time for prayer.",
] as const;

export type HomeOnboardingProps = {
  onAddSermon: () => void;
  /** Our ready-made plans, to try instead; none, no offer. */
  samples: readonly SamplePlan[];
  /** Opens one of them. */
  onOpenSample: (planId: string) => void;
  /** Where Home's welcome has got to (`useWelcomeEntrance`). */
  phase: WelcomePhase;
  /** The note's last letter is in. */
  onTyped: () => void;
  testID: string;
};

/**
 * Home before a reader has a plan of their own, the whole screen — the tab
 * bar steps away. Low on the page, each in its turn of the welcome
 * (`useWelcomeEntrance`): what SundayBest is and what a day of it holds, in the Scripture face, all one
 * ink — written out as a ribbon (`useRibbon`), each letter rising from just
 * below onto its place with a soft tick, several in flight at once; VoiceOver
 * reads each line whole. Then Add your first sermon assembles where the tab bar
 * would be, and "Or try one of ours" opens our ready-made plans.
 */
export function HomeOnboarding({
  onAddSermon,
  samples,
  onOpenSample,
  phase,
  onTyped,
  testID,
}: HomeOnboardingProps) {
  const [samplesOpen, setSamplesOpen] = useState(false);
  // Already played when the page appeared: all simply there. Decided once, so the
  // welcome finishing never snaps a piece still assembling.
  const [instant] = useState(phase === "done");
  const ribbon = useRibbon(WRITTEN, { start: reached(phase, "typing"), instant, onDone: onTyped });
  // Last of all: once the button's words have landed, the link fades in, gently.
  const offer = useOfferFade(reached(phase, "button"), instant);
  return (
    <View testID={testID} style={styles.page}>
      <View style={styles.foot}>
        <View testID={`${testID}-words`} style={styles.words}>
          {WRITTEN.map((text, index) => (
            <RibbonText
              key={text}
              text={text}
              start={ribbon.starts.at(index) ?? 0}
              progress={ribbon.progress}
              kind={index === 0 ? "intro" : "note"}
            />
          ))}
        </View>
        <BeginButton
          testID="home-tab-add-sermon-button"
          label="Add your first sermon"
          onPress={onAddSermon}
          assembled={reached(phase, "button")}
          instant={instant}
        />
        {samples.length > 0 && (
          <Animated.View style={[styles.offer, offer]}>
            <Pressable
              testID={`${testID}-samples`}
              accessibilityRole="button"
              onPress={() => setSamplesOpen(true)}
              style={styles.offerTap}
            >
              <SFProBody>Or try one of ours</SFProBody>
            </Pressable>
          </Animated.View>
        )}
        <SamplePlansSheet
          testID={`${testID}-samples-sheet`}
          visible={samplesOpen}
          samples={samples}
          onClose={() => setSamplesOpen(false)}
          onPick={(planId) => {
            setSamplesOpen(false);
            onOpenSample(planId);
          }}
        />
      </View>
    </View>
  );
}

/**
 * "Or try one of ours" fading in, its turn come: `offerDelayMs` after the
 * button's words land, gently over `offerFadeMs` — no rise. There from the
 * start once the welcome's played.
 */
function useOfferFade(turn: boolean, instant: boolean) {
  const opacity = useSharedValue(instant ? 1 : 0);
  useEffect(() => {
    if (!turn || instant) return;
    opacity.set(withDelay(OFFER_AT, withTiming(1, { duration: motion.welcome.offerFadeMs })));
  }, [turn, instant, opacity]);
  return useAnimatedStyle(() => ({ opacity: opacity.get() }));
}

const styles = StyleSheet.create({
  // The words and the way in at the foot, the button about where the tab
  // bar's capsule would be.
  page: {
    flex: 1,
    justifyContent: "flex-end",
    paddingHorizontal: PAGE_INSET,
    paddingTop: space[28],
    paddingBottom: FLOATING_NAV_BAR.bottomMargin,
  },
  foot: { gap: space[40] },
  words: { gap: space[20] },
  // Close under the button, sharing its room.
  offer: { alignItems: "center", marginTop: -space[24] },
  // A full 44 to tap, though it's one line of words.
  offerTap: { minHeight: controlHeight.hitTarget, justifyContent: "center" },
});
