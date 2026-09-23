import { StyleSheet, Text, View } from "react-native";
import { X } from "lucide-react-native";

import { HeaderIconButton } from "@/ui/HeaderIconButton";
import { ScreenHeader } from "@/ui/ScreenHeader";
import { StepCounter } from "@/ui/StepCounter";
import { useTheme } from "@/theme";
import { LiftAnchor } from "../lift/LiftAnchor";
import { PasteField } from "../lifts/PasteField";
import { MOCK_PAGE, type MockScreenProps } from "./mock-page";

/** Mock of New Plan's first step. Its link field lifts off on its turn. */
export function PasteSermonMock({ elapsedMs }: MockScreenProps) {
  const theme = useTheme();

  return (
    <View style={MOCK_PAGE.page}>
      <ScreenHeader
        title="New plan"
        left={
          <HeaderIconButton
            testID="mock-paste-close"
            icon={X}
            accessibilityLabel="Close"
            onPress={() => undefined}
          />
        }
        right={<StepCounter label="1 of 2" />}
      />

      <Text style={[theme.typography.screenTitle, { color: theme.colors.text }]}>
        Paste a sermon link
      </Text>
      <Text style={[theme.typography.body, { color: theme.colors.textMuted }]}>
        Any public sermon video with captions works.
      </Text>

      <View style={styles.field}>
        <LiftAnchor>
          <PasteField elapsedMs={elapsedMs} />
        </LiftAnchor>
      </View>

      <Text style={[theme.typography.body, styles.hint, { color: theme.colors.textMuted }]}>
        How to copy a link
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { marginTop: 12 },
  hint: { marginTop: 18 },
});
