import { Text } from "react-native";

import { useTheme } from "@/theme";

export type StudyKickerProps = {
  dayNumber: number;
  /** The step or question: "Read", "Question 1 of 2". */
  label: string;
};

/** The small line over each Daily Study step: "Day 2  Read". */
export function StudyKicker({ dayNumber, label }: StudyKickerProps) {
  const theme = useTheme();

  return (
    <Text style={[theme.typography.metaLabel, { color: theme.colors.text }]}>
      {`Day ${dayNumber}  `}
      <Text style={{ color: theme.colors.textMuted }}>{label}</Text>
    </Text>
  );
}
