import { StyleSheet, View } from "react-native";
import { HandHeart, Lock } from "lucide-react-native";

import { radius, space, useTheme } from "@/theme";
import { Card } from "@/ui/atoms/Card";
import { LiftAnchor } from "../lift/LiftAnchor";
import { getLiftId } from "../../logic/lift";
import { AnswerBox } from "../lifts/AnswerBox";
import { ListenCard } from "../lifts/ListenCard";
import { PrayerLines } from "../lifts/PrayerLines";
import { VerseCard } from "../lifts/VerseCard";
import { FadeUp } from "./FadeUp";
import { MOCK_PAGE } from "./mock-page-styles";
import type { MockBodyProps } from "../../logic/mock-page";
import { StudyKicker } from "./StudyMockHeader";
import { DisplayTitle } from "@/ui/typography/DisplayTitle";
import { MonoBody } from "@/ui/typography/MonoBody";
import { SFProBody } from "@/ui/typography/SFProBody";
import { SFProTitle } from "@/ui/typography/SFProTitle";
import { SerifTitle } from "@/ui/typography/SerifTitle";

/** Daily Study's Read step: the day's reading. "Hear this part of the sermon" lifts off. */
export function ReadBody({ elapsedMs }: MockBodyProps) {
  const still = elapsedMs === Infinity;

  return (
    <View style={MOCK_PAGE.body}>
      <FadeUp order={0} still={still}>
        <StudyKicker label="Read" />
      </FadeUp>
      <FadeUp order={1} still={still}>
        <DisplayTitle>Grace is received</DisplayTitle>
      </FadeUp>
      <FadeUp order={2} still={still}>
        <SFProBody variant="reading" tone="textInactive">
          Most of us believe grace is free. We just don&apos;t live like it. We keep a quiet ledger:
          a good morning here, a kept promise there, as if God were checking the balance.
        </SFProBody>
      </FadeUp>
      <FadeUp order={3} still={still}>
        <SFProBody variant="reading" tone="textInactive">
          Joshua&apos;s call to choose wasn&apos;t a call to earn. Israel was rescued long before
          they promised anything. Choosing God starts with receiving what He&apos;s already done.
        </SFProBody>
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
          <SFProTitle>Ephesians 2:8</SFProTitle>
          <View
            style={[styles.pill, { borderColor: theme.colors.divider, borderRadius: radius.pill }]}
          >
            <SFProBody variant="label" tone="textInactive">
              NIV
            </SFProBody>
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
        <SFProTitle>Grace is received</SFProTitle>
      </FadeUp>
      <FadeUp order={2} still={still}>
        <Card fill="page" style={styles.card}>
          <SerifTitle variant="question">What are you still trying to pay for?</SerifTitle>
          <LiftAnchor id={getLiftId("reflect", 0)}>
            <AnswerBox elapsedMs={elapsedMs} />
          </LiftAnchor>
          <View style={styles.privacy}>
            <Lock size={16} color={theme.colors.textMuted} strokeWidth={theme.icon.strokeWidth} />
            <MonoBody variant="supporting" tone="textMuted">
              Only you ever see this.
            </MonoBody>
          </View>
        </Card>
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
          <SFProTitle>A prayer for today</SFProTitle>
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

/** Pray's round badge, as on the real Pray step. */
const BADGE_SIZE = 52;

const styles = StyleSheet.create({
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  pill: { borderWidth: 1, paddingHorizontal: space[14], paddingVertical: space[6] },
  card: { padding: space[22], gap: space[16] },
  privacy: { flexDirection: "row", alignItems: "center", gap: space[8] },
  prayTitle: { flexDirection: "row", alignItems: "center", gap: space[14] },
  badge: {
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: BADGE_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
  },
});
