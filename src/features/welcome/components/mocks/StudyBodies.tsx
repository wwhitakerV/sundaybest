import { View } from "react-native";

import { PassageHeading } from "@/entities/scripture";
import { PrayerHeading, ReflectionCard, StepKicker } from "@/entities/study";
import { LiftAnchor } from "../lift/LiftAnchor";
import { getLiftId } from "../../logic/lift";
import { AnswerBox } from "../lifts/AnswerBox";
import { ListenCard } from "../lifts/ListenCard";
import { PrayerLines } from "../lifts/PrayerLines";
import { VerseCard } from "../lifts/VerseCard";
import { FadeUp } from "./FadeUp";
import { MOCK_PAGE } from "./mock-page-styles";
import type { MockBodyProps } from "../../logic/mock-page";
import { DisplayTitle } from "@/ui/typography/DisplayTitle";
import { SFProBody } from "@/ui/typography/SFProBody";
import { SFProTitle } from "@/ui/typography/SFProTitle";

/** Daily Study's Read step: the day's reading. "Hear this part of the sermon" lifts off. */
export function ReadBody({ elapsedMs }: MockBodyProps) {
  const still = elapsedMs === Infinity;

  return (
    <View style={MOCK_PAGE.body}>
      <FadeUp order={0} still={still}>
        <StepKicker dayNumber={2} label="Read" />
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
  const still = elapsedMs === Infinity;

  return (
    <View style={MOCK_PAGE.body}>
      <FadeUp order={0} still={still}>
        <StepKicker dayNumber={2} label="Scripture" />
      </FadeUp>
      <FadeUp order={1} still={still}>
        <PassageHeading reference="Ephesians 2:8" translation="NIV" />
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
  const still = elapsedMs === Infinity;

  return (
    <View style={MOCK_PAGE.body}>
      <FadeUp order={0} still={still}>
        <StepKicker dayNumber={2} label="Question 1 of 2" />
      </FadeUp>
      <FadeUp order={1} still={still}>
        <SFProTitle>Grace is received</SFProTitle>
      </FadeUp>
      <FadeUp order={2} still={still}>
        <ReflectionCard question="What are you still trying to pay for?">
          <LiftAnchor id={getLiftId("reflect", 0)}>
            <AnswerBox elapsedMs={elapsedMs} />
          </LiftAnchor>
        </ReflectionCard>
      </FadeUp>
    </View>
  );
}

/** Daily Study's Pray step. Its prayer lifts off. */
export function PrayBody({ elapsedMs }: MockBodyProps) {
  const still = elapsedMs === Infinity;

  return (
    <View style={MOCK_PAGE.body}>
      <FadeUp order={0} still={still}>
        <StepKicker dayNumber={2} label="Pray" />
      </FadeUp>
      <FadeUp order={1} still={still}>
        <PrayerHeading title="A prayer for today" />
      </FadeUp>
      <FadeUp order={2} still={still}>
        <LiftAnchor id={getLiftId("pray", 0)}>
          <PrayerLines elapsedMs={elapsedMs} />
        </LiftAnchor>
      </FadeUp>
    </View>
  );
}
