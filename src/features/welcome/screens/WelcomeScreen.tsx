import { ScrollView, StyleSheet, View } from "react-native";

import { Screen } from "@/ui/organisms/Screen";
import { Button } from "@/ui/atoms/Button";
import { DayStrip } from "../components/DayStrip";
import { useReduceMotion } from "@/core/accessibility/use-reduce-motion";
import { IntroStory } from "../components/IntroStory";
import { WelcomeSteps } from "../components/WelcomeSteps";
import { useWelcomeStart } from "../hooks/use-welcome-start";
import { useVisit } from "../hooks/use-visit";
import { space } from "@/theme";
import { DisplayTitle } from "@/ui/typography/DisplayTitle";
import { MonoBody } from "@/ui/typography/MonoBody";
import { Wordmark } from "@/ui/typography/Wordmark";
import { Span } from "@/ui/typography/Span";

export function WelcomeScreen() {
  // The intro story tells how it works. With Reduce Motion on it holds still
  // on its opening — the first screen on stage — and the steps are listed instead.
  const reduceMotion = useReduceMotion();
  // It plays only while the screen can be seen, and starts over on every
  // visit: the moment the screen starts being left it holds still where it
  // is — staying drawn, so nothing tears down under what arrives over it —
  // and it mounts fresh once the screen has come back and settled.
  const visit = useVisit();
  const { start, starting, seeSample } = useWelcomeStart();

  return (
    <Screen testID="welcome-screen">
      {/*
       * Scrolls only when the page is taller than the phone (smaller iPhones,
       * or Reduce Motion's list). `flexGrow` lets the stage (or, with Reduce
       * Motion, the space above the fan) take up whatever height is spare.
       * The page inset lives on the scroll content, not `Screen`, so the
       * stage can bleed to the screen edges without the scroll view
       * clipping it.
       */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Wordmark />
        </View>

        <View style={styles.weekRow}>
          <DayStrip testID="welcome-day-strip" active="Sun" />
        </View>

        <MonoBody variant="supporting" tone="textMuted" style={styles.supporting}>
          We keep you in God&apos;s word. All week.
        </MonoBody>

        <DisplayTitle style={reduceMotion ? styles.stillHero : styles.hero}>
          {"A new way to "}
          <Span tone="textMuted">study the sermons you love.</Span>
        </DisplayTitle>

        <IntroStory
          key={visit.count}
          testID="welcome-screen-fan"
          paused={reduceMotion}
          frozen={!visit.playing}
          style={reduceMotion ? styles.stillFan : styles.stage}
        />

        {reduceMotion && <WelcomeSteps />}

        <View style={reduceMotion ? styles.stillActions : styles.actions}>
          <Button
            testID="welcome-get-a-plan-now-button"
            label="Get a plan now"
            loading={starting}
            onPress={start}
          />
          <View style={styles.secondaryAction}>
            <Button
              testID="welcome-sample-plan-button"
              label="See a sample plan"
              variant="secondary"
              onPress={seeSample}
            />
          </View>
          <MonoBody variant="supporting" tone="textMuted" style={styles.footnote}>
            Free. No account needed.
          </MonoBody>
        </View>
      </ScrollView>
    </Screen>
  );
}

// Every number is the design spec's 320px value multiplied by 1.228125 (the
// 393pt baseline) and rounded once — see the typography block in
// src/theme/tokens.ts. Fixed, never scaled from the running device's width.
/** The week row's 29 from the brand mark, less the header bar's own 12 (see below). */
const WEEK_ROW_TOP = 17;
/** The spec's gaps above the headline and above the footnote. */
const HERO_TOP = 26;
const FOOTNOTE_TOP = 17;

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: space[24] },
  // 20px above the wordmark and 12px below. The week row's own 29 (the spec's
  // 24 from the brand-mark area) is measured from this bar's edge, so it
  // carries 17 here and the bar's 12 makes up the rest.
  header: { paddingTop: space[20], paddingBottom: space[12] },
  weekRow: { marginTop: WEEK_ROW_TOP },
  supporting: { marginTop: space[15] },
  // With the intro playing, the page flows top-down and the stage takes all
  // the height the rest leaves, so the phone on stage is as big as the
  // device allows. Full-bleed: the stage runs past the 24pt page inset. It
  // stops 20pt short of the buttons, so a little more of the phone is cut
  // off under its fade, and the steps line sits higher on it.
  stage: { flex: 1, marginTop: space[22], marginBottom: space[20], marginHorizontal: -space[24] },
  hero: { marginTop: HERO_TOP },
  actions: { marginTop: space[24], paddingBottom: space[20] },
  // With Reduce Motion on, the hand holds still at a fixed size and the page
  // anchors from the bottom: fan, headline, and the steps listed, sitting
  // together above the buttons, any spare height above the fan.
  stillFan: { height: 230, marginTop: "auto", marginHorizontal: -space[24] },
  stillHero: { marginTop: space[36] },
  // A fixed, generous gap from the end of the list down to the buttons.
  stillActions: { marginTop: space[40], paddingBottom: space[20] },
  secondaryAction: { marginTop: space[12] },
  footnote: { marginTop: FOOTNOTE_TOP, textAlign: "center" },
});
