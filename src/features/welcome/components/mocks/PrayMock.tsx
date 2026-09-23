import { StyleSheet, Text, View } from "react-native";
import { HandHeart } from "lucide-react-native";

import { useTheme } from "@/theme";
import { LiftAnchor } from "../lift/LiftAnchor";
import { PrayerLines } from "../lifts/PrayerLines";
import { MOCK_PAGE, type MockScreenProps } from "./mock-page";
import { StudyMockHeader } from "./StudyMockHeader";

/** Mock of Daily Study's Pray step. Its prayer lifts off on its turn. */
export function PrayMock({ elapsedMs }: MockScreenProps) {
  const theme = useTheme();

  return (
    <View style={MOCK_PAGE.page}>
      <StudyMockHeader testID="mock-pray" activeStep={3} kicker="Pray" />

      <View style={styles.titleRow}>
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

      <LiftAnchor>
        <PrayerLines elapsedMs={elapsedMs} />
      </LiftAnchor>
    </View>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  badge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
});
