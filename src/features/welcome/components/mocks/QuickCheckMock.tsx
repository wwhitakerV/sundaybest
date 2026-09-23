import { StyleSheet, Text, View } from "react-native";
import { X } from "lucide-react-native";

import { HeaderIconButton } from "@/ui/HeaderIconButton";
import { ScreenHeader } from "@/ui/ScreenHeader";
import { StepCounter } from "@/ui/StepCounter";
import { StepProgress } from "@/ui/StepProgress";
import { useTheme } from "@/theme";
import { LiftAnchor } from "../lift/LiftAnchor";
import { QuizOptions } from "../lifts/QuizOptions";
import { MOCK_PAGE, type MockScreenProps } from "./mock-page";

/** Mock of a Quick Check question. Its answers lift off on its turn. */
export function QuickCheckMock({ elapsedMs }: MockScreenProps) {
  const theme = useTheme();

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
        right={<StepCounter label="1 of 2" />}
      />
      <StepProgress steps={3} activeIndex={0} />

      <Text style={[theme.typography.metaBody, styles.kicker, { color: theme.colors.textMuted }]}>
        From the sermon
      </Text>
      <Text style={[theme.typography.screenTitle, { color: theme.colors.text }]}>
        In Joshua 24, what does Joshua ask the people to do?
      </Text>

      <View style={styles.options}>
        <LiftAnchor>
          <QuizOptions elapsedMs={elapsedMs} />
        </LiftAnchor>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  kicker: { marginTop: 8 },
  options: { marginTop: 8 },
});
