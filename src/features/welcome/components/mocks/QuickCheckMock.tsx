import { StyleSheet, Text, View } from "react-native";
import { X } from "lucide-react-native";

import { HeaderIconButton } from "@/ui/HeaderIconButton";
import { ScreenHeader } from "@/ui/ScreenHeader";
import { StepCounter } from "@/ui/StepCounter";
import { StepProgress } from "@/ui/StepProgress";
import { useTheme } from "@/theme";
import { LiftAnchor } from "../lift/LiftAnchor";
import { getLiftId } from "../lift/lift-anchor-context";
import { QuizOptions } from "../lifts/QuizOptions";
import { FadeUp } from "./FadeUp";
import { MOCK_PAGE, type MockScreenProps } from "./mock-page";

/** Mock of a Quick Check question — pushed onto, as the real one is. Its answers lift off on its turn. */
export function QuickCheckMock({ elapsedMs }: MockScreenProps) {
  const theme = useTheme();
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
        <Text style={[theme.typography.metaBody, styles.kicker, { color: theme.colors.textMuted }]}>
          From the sermon
        </Text>
      </FadeUp>
      <FadeUp order={1} still={still}>
        <Text style={[theme.typography.screenTitle, { color: theme.colors.text }]}>
          In Joshua 24, what does Joshua ask the people to do?
        </Text>
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
  kicker: { marginTop: 8 },
  options: { marginTop: 8 },
});
