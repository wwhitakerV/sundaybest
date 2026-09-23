import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { BookOpen, Calendar, Link2 } from "lucide-react-native";

import { Screen } from "@/ui/Screen";
import { Button } from "@/ui/Button";
import { DayStrip } from "@/ui/DayStrip";
import { useTheme } from "@/theme";
import { SAMPLE_PLAN_ID } from "@/features/plans";

type Step = {
  Icon: typeof Link2;
  label: string;
};

const STEPS: readonly Step[] = [
  { Icon: Link2, label: "Paste any sermon link" },
  { Icon: Calendar, label: "Get a plan for 1 to 7 days" },
  { Icon: BookOpen, label: "Read, reflect, pray, and quiz" },
];

const ICON_SIZE = 20;

export function WelcomeScreen() {
  const theme = useTheme();
  const router = useRouter();

  return (
    <Screen testID="welcome-screen" style={styles.content}>
      <View style={styles.header}>
        <Text style={[theme.typography.masthead, { color: theme.colors.text }]}>SUNDAYBEST</Text>
      </View>

      <View style={styles.weekRow}>
        <DayStrip testID="welcome-day-strip" active="Sun" />
      </View>

      <Text
        style={[theme.typography.supporting, styles.supporting, { color: theme.colors.textMuted }]}
      >
        We keep you in God&apos;s word. All week.
      </Text>

      <Text style={[theme.typography.display, styles.hero, { color: theme.colors.text }]}>
        {"A new kind of Bible plan. "}
        <Text style={{ color: theme.colors.textMuted }}>Built from the sermons you love.</Text>
      </Text>

      <View style={styles.steps}>
        {STEPS.map(({ Icon, label }) => (
          <View key={label} style={[styles.step, { borderBottomColor: theme.colors.divider }]}>
            <View style={styles.iconArea}>
              <Icon size={ICON_SIZE} color={theme.colors.text} strokeWidth={1.75} />
            </View>
            <Text style={[theme.typography.listItem, { color: theme.colors.text }]}>{label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.actions}>
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
            onPress={() =>
              router.push({
                pathname: "/(tabs)/plans/[planId]",
                params: { planId: SAMPLE_PLAN_ID },
              })
            }
          />
        </View>
        <Text
          style={[theme.typography.supporting, styles.footnote, { color: theme.colors.textMuted }]}
        >
          Free. No account needed.
        </Text>
      </View>
    </Screen>
  );
}

// Every number is the design spec's 320px value multiplied by 1.228125 (the
// 393pt baseline) and rounded once — see the typography block in
// src/theme/tokens.ts. Fixed, never scaled from the running device's width.
const styles = StyleSheet.create({
  content: { paddingHorizontal: 24 },
  // 12px above and below the wordmark. The week row's own 29 (the spec's 24
  // from the brand-mark area) is measured from this bar's edge, so it carries
  // 17 here and the bar's 12 makes up the rest.
  header: { paddingVertical: 12 },
  weekRow: { marginTop: 17 },
  supporting: { marginTop: 15 },
  hero: { marginTop: 29 },
  steps: { marginTop: 21, gap: 12 },
  step: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
  },
  iconArea: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  actions: { marginTop: "auto", paddingBottom: 8 },
  secondaryAction: { marginTop: 12 },
  footnote: { marginTop: 17, textAlign: "center" },
});
