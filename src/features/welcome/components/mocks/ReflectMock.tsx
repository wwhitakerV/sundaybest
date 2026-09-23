import { StyleSheet, Text, View } from "react-native";
import { Lock } from "lucide-react-native";

import { useTheme } from "@/theme";
import { LiftAnchor } from "../lift/LiftAnchor";
import { AnswerBox } from "../lifts/AnswerBox";
import { MOCK_PAGE, type MockScreenProps } from "./mock-page";
import { StudyMockHeader } from "./StudyMockHeader";

/** Mock of Daily Study's Reflect step. Its answer box lifts off on its turn. */
export function ReflectMock({ elapsedMs }: MockScreenProps) {
  const theme = useTheme();

  return (
    <View style={MOCK_PAGE.page}>
      <StudyMockHeader testID="mock-reflect" activeStep={2} kicker="Question 1 of 2" />

      <Text style={[theme.typography.screenTitle, { color: theme.colors.text }]}>
        Grace is received
      </Text>

      <View
        style={[
          styles.card,
          { backgroundColor: theme.colors.background, borderColor: theme.colors.divider },
        ]}
      >
        <Text
          style={[theme.typography.editorialHeading, styles.question, { color: theme.colors.text }]}
        >
          What are you still trying to pay for?
        </Text>
        <LiftAnchor>
          <AnswerBox elapsedMs={elapsedMs} />
        </LiftAnchor>
        <View style={styles.privacy}>
          <Lock size={16} color={theme.colors.textMuted} strokeWidth={theme.icon.strokeWidth} />
          <Text style={[theme.typography.supporting, { color: theme.colors.textMuted }]}>
            Only you ever see this.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 28, padding: 22, gap: 16 },
  question: { fontSize: 24, lineHeight: 30 },
  privacy: { flexDirection: "row", alignItems: "center", gap: 8 },
});
