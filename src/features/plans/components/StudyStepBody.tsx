import { Text } from "react-native";

import { useTheme } from "@/theme";
import type { StudyStepKey } from "../logic/study-steps";

export type StudyStepBodyProps = {
  stepKey: StudyStepKey;
};

/** The body content for one Daily Study step (placeholder copy for now). */
export function StudyStepBody({ stepKey }: StudyStepBodyProps) {
  const theme = useTheme();

  return (
    <Text
      testID={`study-${stepKey}-body`}
      style={[theme.typography.body, { color: theme.colors.text }]}
    >
      ...
    </Text>
  );
}
