import { StyleSheet, Text, View } from "react-native";
import { HandHeart, Lock } from "lucide-react-native";

import { useTheme } from "@/theme";
import { LiftAnchor } from "../lift/LiftAnchor";
import { getLiftId } from "../lift/lift-anchor-context";
import { AnswerBox } from "../lifts/AnswerBox";
import { ListenCard } from "../lifts/ListenCard";
import { PrayerLines } from "../lifts/PrayerLines";
import { VerseCard } from "../lifts/VerseCard";
import { FadeUp } from "./FadeUp";
import { MOCK_PAGE, type MockBodyProps } from "./mock-page";
import { StudyKicker } from "./StudyMockHeader";

/** Daily Study's Read step: the day's reading. "Hear this part of the sermon" lifts off. */
export function ReadBody({ elapsedMs }: MockBodyProps) {
  const theme = useTheme();
  const still = elapsedMs === Infinity;

  return (
    <View style={MOCK_PAGE.body}>
      <FadeUp order={0} still={still}>
        <StudyKicker label="Read" />
      </FadeUp>
      <FadeUp order={1} still={still}>
        <Text style={[theme.typography.display, { color: theme.colors.text }]}>
          Grace is received
        </Text>
      </FadeUp>
      <FadeUp order={2} still={still}>
        <Text style={[theme.typography.reading, { color: theme.colors.textInactive }]}>
          Most of us believe grace is free. We just don&apos;t live like it. We keep a quiet ledger:
          a good morning here, a kept promise there, as if God were checking the balance.
        </Text>
      </FadeUp>
      <FadeUp order={3} still={still}>
        <Text style={[theme.typography.reading, { color: theme.colors.textInactive }]}>
          Joshua&apos;s call to choose wasn&apos;t a call to earn. Israel was rescued long before
          they promised anything. Choosing God starts with receiving what He&apos;s already done.
        </Text>
      </FadeUp>
      <FadeUp order={4} still={still}>
        <LiftAnchor id={getLiftId("read", 0)}>
          <ListenCard elapsedMs={elapsedMs} />
        </LiftAnchor>
      </FadeUp>
    </View>
  );
}

/** Daily Study's Scripture step. Its verse lifts off. */
export function ScriptureBody({ elapsedMs }: MockBodyProps) {
  const theme = useTheme();
  const still = elapsedMs === Infinity;

  return (
    <View style={MOCK_PAGE.body}>
      <FadeUp order={0} still={still}>
        <StudyKicker label="Scripture" />
      </FadeUp>
      <FadeUp order={1} still={still}>
        <View style={styles.titleRow}>
          <Text style={[theme.typography.screenTitle, { color: theme.colors.text }]}>
            Ephesians 2:8
          </Text>
          <View
            style={[
              styles.pill,
              { borderColor: theme.colors.divider, borderRadius: theme.radii.pill },
            ]}
          >
            <Text style={[theme.typography.label, { color: theme.colors.textInactive }]}>NIV</Text>
          </View>
        </View>
      </FadeUp>
      <FadeUp order={2} still={still}>
        <LiftAnchor id={getLiftId("scripture", 0)}>
          <VerseCard elapsedMs={elapsedMs} />
        </LiftAnchor>
      </FadeUp>
    </View>
  );
}

/** Daily Study's Reflect step. Its answer box lifts off. */
export function ReflectBody({ elapsedMs }: MockBodyProps) {
  const theme = useTheme();
  const still = elapsedMs === Infinity;

  return (
    <View style={MOCK_PAGE.body}>
      <FadeUp order={0} still={still}>
        <StudyKicker label="Question 1 of 2" />
      </FadeUp>
      <FadeUp order={1} still={still}>
        <Text style={[theme.typography.screenTitle, { color: theme.colors.text }]}>
          Grace is received
        </Text>
      </FadeUp>
      <FadeUp order={2} still={still}>
        <View
          style={[
            styles.card,
            { backgroundColor: theme.colors.background, borderColor: theme.colors.divider },
          ]}
        >
          <Text
            style={[
              theme.typography.editorialHeading,
              styles.question,
              { color: theme.colors.text },
            ]}
          >
            What are you still trying to pay for?
          </Text>
          <LiftAnchor id={getLiftId("reflect", 0)}>
            <AnswerBox elapsedMs={elapsedMs} />
          </LiftAnchor>
          <View style={styles.privacy}>
            <Lock size={16} color={theme.colors.textMuted} strokeWidth={theme.icon.strokeWidth} />
            <Text style={[theme.typography.supporting, { color: theme.colors.textMuted }]}>
              Only you ever see this.
            </Text>
          </View>
        </View>
      </FadeUp>
    </View>
  );
}

/** Daily Study's Pray step. Its prayer lifts off. */
export function PrayBody({ elapsedMs }: MockBodyProps) {
  const theme = useTheme();
  const still = elapsedMs === Infinity;

  return (
    <View style={MOCK_PAGE.body}>
      <FadeUp order={0} still={still}>
        <StudyKicker label="Pray" />
      </FadeUp>
      <FadeUp order={1} still={still}>
        <View style={styles.prayTitle}>
          <View style={[styles.badge, { backgroundColor: theme.colors.controlPrimary }]}>
            <HandHeart
              size={24}
              color={theme.colors.onControlPrimary}
              strokeWidth={theme.icon.strokeWidth}
            />
          </View>
          <Text style={[theme.typography.screenTitle, { color: theme.colors.text }]}>
            A prayer for today
          </Text>
        </View>
      </FadeUp>
      <FadeUp order={2} still={still}>
        <LiftAnchor id={getLiftId("pray", 0)}>
          <PrayerLines elapsedMs={elapsedMs} />
        </LiftAnchor>
      </FadeUp>
    </View>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  pill: { borderWidth: 1, paddingHorizontal: 14, paddingVertical: 6 },
  card: { borderWidth: 1, borderRadius: 28, padding: 22, gap: 16 },
  question: { fontSize: 24, lineHeight: 30 },
  privacy: { flexDirection: "row", alignItems: "center", gap: 8 },
  prayTitle: { flexDirection: "row", alignItems: "center", gap: 14 },
  badge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
});
