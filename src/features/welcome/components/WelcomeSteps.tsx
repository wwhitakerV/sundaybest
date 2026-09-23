import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/theme";
import { WELCOME_STEPS, getStepLabel } from "./welcome-steps";

const ICON_SIZE = 20;

/**
 * The how-it-works list, still. Shown instead of the intro story when
 * Reduce Motion is on, so the three steps are always told one way or the
 * other.
 */
export function WelcomeSteps() {
  const theme = useTheme();

  return (
    <View style={styles.steps}>
      {WELCOME_STEPS.map((step) => {
        const label = getStepLabel(step);
        const { Icon } = step;
        return (
          <View key={label} style={[styles.step, { borderBottomColor: theme.colors.divider }]}>
            <View style={styles.iconArea}>
              <Icon size={ICON_SIZE} color={theme.colors.text} strokeWidth={1.75} />
            </View>
            <Text style={[theme.typography.listItem, { color: theme.colors.text }]}>{label}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  steps: { marginTop: 21, gap: 12 },
  step: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
  },
  iconArea: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },
});
