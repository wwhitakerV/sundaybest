import { Text } from "react-native";

import { useTheme } from "@/theme";

export type StepCounterProps = {
  /** e.g. "1 of 2". */
  label: string;
};

/** The right-aligned step count in a flow header ("1 of 2"). */
export function StepCounter({ label }: StepCounterProps) {
  const theme = useTheme();

  return (
    <Text style={[theme.typography.stepCounter, { color: theme.colors.chromeStepCounter }]}>
      {label}
    </Text>
  );
}
