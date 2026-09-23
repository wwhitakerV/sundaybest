import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/theme";
import { LiftAnchor } from "../lift/LiftAnchor";
import { VerseCard } from "../lifts/VerseCard";
import { MOCK_PAGE, type MockScreenProps } from "./mock-page";
import { StudyMockHeader } from "./StudyMockHeader";

/** Mock of Daily Study's Scripture step — the story's "Read". Its verse lifts off on its turn. */
export function ScriptureMock({ elapsedMs }: MockScreenProps) {
  const theme = useTheme();

  return (
    <View style={MOCK_PAGE.page}>
      <StudyMockHeader testID="mock-scripture" activeStep={1} kicker="Scripture" />

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
          <Text style={[theme.typography.label, { color: theme.colors.textInactive }]}>BSB</Text>
        </View>
      </View>

      <LiftAnchor>
        <VerseCard elapsedMs={elapsedMs} />
      </LiftAnchor>
    </View>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  pill: { borderWidth: 1, paddingHorizontal: 14, paddingVertical: 6 },
});
