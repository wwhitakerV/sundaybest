import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { Screen } from "@/ui/Screen";
import { Button } from "@/ui/Button";
import { DayStrip } from "@/ui/DayStrip";
import { useTheme } from "@/theme";
import { SAMPLE_PLAN_ID, planOverviewHref } from "@/features/plans";
import { useReduceMotion } from "@/core/accessibility/use-reduce-motion";
import { IntroStory } from "../components/IntroStory";
import { WelcomeSteps } from "../components/WelcomeSteps";
import { useVisit } from "../hooks/use-visit";

export function WelcomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  // The intro story tells how it works. With Reduce Motion on it holds still
  // on its opening — the first screen on stage — and the steps are listed instead.
  const reduceMotion = useReduceMotion();
  // It plays only while the screen can be seen, and starts over on every
  // visit: once covered it's unmounted (its timers and animations with it),
  // and it mounts fresh once the screen has come back and settled.
  const visit = useVisit();

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
          <Text style={[theme.typography.masthead, { color: theme.colors.text }]}>SUNDAYBEST</Text>
        </View>

        <View style={styles.weekRow}>
          <DayStrip testID="welcome-day-strip" active="Sun" />
        </View>

        <Text
          style={[
            theme.typography.supporting,
            styles.supporting,
            { color: theme.colors.textMuted },
          ]}
        >
          We keep you in God&apos;s word. All week.
        </Text>

        <Text
          style={[
            theme.typography.display,
            reduceMotion ? styles.stillHero : styles.hero,
            { color: theme.colors.text },
          ]}
        >
          {"A new way to "}
          <Text style={{ color: theme.colors.textMuted }}>study the sermons you love.</Text>
        </Text>

        {visit.visible ? (
          <IntroStory
            key={visit.count}
            testID="welcome-screen-fan"
            paused={reduceMotion}
            style={reduceMotion ? styles.stillFan : styles.stage}
          />
        ) : (
          // Holds its place while out of view, so the page doesn't reflow.
          <View style={reduceMotion ? styles.stillFan : styles.stage} />
        )}

        {reduceMotion && <WelcomeSteps />}

        <View style={reduceMotion ? styles.stillActions : styles.actions}>
          <Button
            testID="welcome-get-a-plan-now-button"
            label="Get a plan now"
            onPress={() => router.push("/(tabs)/home")}
          />
          <View style={styles.secondaryAction}>
            <Button
              testID="welcome-sample-plan-button"
              label="See a sample plan"
              variant="secondary"
              onPress={() => router.push(planOverviewHref(SAMPLE_PLAN_ID))}
            />
          </View>
          <Text
            style={[
              theme.typography.supporting,
              styles.footnote,
              { color: theme.colors.textMuted },
            ]}
          >
            Free. No account needed.
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

// Every number is the design spec's 320px value multiplied by 1.228125 (the
// 393pt baseline) and rounded once — see the typography block in
// src/theme/tokens.ts. Fixed, never scaled from the running device's width.
const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 24 },
  // 20px above the wordmark and 12px below. The week row's own 29 (the spec's
  // 24 from the brand-mark area) is measured from this bar's edge, so it
  // carries 17 here and the bar's 12 makes up the rest.
  header: { paddingTop: 20, paddingBottom: 12 },
  weekRow: { marginTop: 17 },
  supporting: { marginTop: 15 },
  // With the intro playing, the page flows top-down and the stage takes all
  // the height the rest leaves, so the phone on stage is as big as the
  // device allows. Full-bleed: the stage runs past the 24pt page inset. It
  // stops 20pt short of the buttons, so a little more of the phone is cut
  // off under its fade, and the steps line sits higher on it.
  stage: { flex: 1, marginTop: 22, marginBottom: 20, marginHorizontal: -24 },
  hero: { marginTop: 26 },
  actions: { marginTop: 24, paddingBottom: 20 },
  // With Reduce Motion on, the hand holds still at a fixed size and the page
  // anchors from the bottom: fan, headline, and the steps listed, sitting
  // together above the buttons, any spare height above the fan.
  stillFan: { height: 230, marginTop: "auto", marginHorizontal: -24 },
  stillHero: { marginTop: 36 },
  // A fixed, generous gap from the end of the list down to the buttons.
  stillActions: { marginTop: 40, paddingBottom: 20 },
  secondaryAction: { marginTop: 12 },
  footnote: { marginTop: 17, textAlign: "center" },
});
