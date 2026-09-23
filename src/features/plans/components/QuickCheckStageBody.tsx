import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/theme";
import type { QuickCheckStage } from "../logic/quick-check-stages";
import { QuickCheckOptions } from "./QuickCheckOptions";

export type QuickCheckStageBodyProps = {
  stage: QuickCheckStage;
};

/** The body content for one Quick Check stage (placeholder copy for now). */
export function QuickCheckStageBody({ stage }: QuickCheckStageBodyProps) {
  const theme = useTheme();

  return (
    <View testID={`quick-check-${stage.key}-body`} style={styles.body}>
      <Text style={[theme.typography.body, { color: theme.colors.text }]}>...</Text>
      {stage.hasOptions && <QuickCheckOptions testIDPrefix={`quick-check-${stage.key}`} />}
    </View>
  );
}

const styles = StyleSheet.create({
  body: { gap: 16 },
});
