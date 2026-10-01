import { StyleSheet, View } from "react-native";
import { X } from "lucide-react-native";

import { HeaderIconButton } from "@/ui/atoms/HeaderIconButton";
import { ScreenHeader } from "@/ui/molecules/ScreenHeader";
import { StepCounter } from "@/ui/atoms/StepCounter";
import { StepProgress } from "@/ui/atoms/StepProgress";
import { LiftAnchor } from "../lift/LiftAnchor";
import { getLiftId } from "../../logic/lift";
import { QuizOptions } from "../lifts/QuizOptions";
import { FadeUp } from "./FadeUp";
import { MOCK_PAGE } from "./mock-page-styles";
import type { MockScreenProps } from "../../logic/mock-page";
import { space } from "@/theme";
import { MonoBody } from "@/ui/typography/MonoBody";
import { SFProTitle } from "@/ui/typography/SFProTitle";

/** Mock of a Quick Check question — pushed onto, as the real one is. Its answers lift off on its turn. */
export function QuickCheckMock({ elapsedMs }: MockScreenProps) {
  const still = elapsedMs === Infinity;

  return (
    <View style={MOCK_PAGE.page}>
      <ScreenHeader
        title="Quick check"
        left={
          <HeaderIconButton
            testID="mock-quiz-close"
            icon={X}
            accessibilityLabel="Close"
            onPress={() => undefined}
          />
        }
        right={<StepCounter label="1 of 3" />}
      />
      <StepProgress steps={3} activeIndex={0} />

      <FadeUp order={0} still={still}>
        <MonoBody tone="textMuted" style={styles.kicker}>
          From the sermon
        </MonoBody>
      </FadeUp>
      <FadeUp order={1} still={still}>
        <SFProTitle>In Joshua 24, what does Joshua ask the people to do?</SFProTitle>
      </FadeUp>

      <FadeUp order={2} still={still}>
        <View style={styles.options}>
          <LiftAnchor id={getLiftId("quiz", 0)}>
            <QuizOptions elapsedMs={elapsedMs} />
          </LiftAnchor>
        </View>
      </FadeUp>
    </View>
  );
}

const styles = StyleSheet.create({
  kicker: { marginTop: space[8] },
  options: { marginTop: space[8] },
});
