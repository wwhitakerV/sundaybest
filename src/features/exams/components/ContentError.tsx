import { Text, View } from "react-native";

import { useTheme } from "@/theme";

export type ContentErrorProps = {
  /** Field paths only — never the values at them. */
  issues: readonly string[];
};

/**
 * An exam whose content failed its checks: plainly unavailable, with the
 * failing field paths for whoever maintains the content. Nothing can start.
 */
export function ContentError({ issues }: ContentErrorProps) {
  const theme = useTheme();

  return (
    <View testID="exam-content-error" style={{ gap: theme.spacing.sm }}>
      <Text
        accessibilityRole="header"
        style={[theme.typography.stepTitle, { color: theme.colors.text }]}
      >
        This exam can&apos;t be opened
      </Text>
      <Text style={[theme.typography.body, { color: theme.colors.textInactive }]}>
        Its content didn&apos;t pass its checks. For the team:
      </Text>
      {issues.map((issue) => (
        <Text key={issue} style={[theme.typography.supporting, { color: theme.colors.textMuted }]}>
          {issue}
        </Text>
      ))}
    </View>
  );
}
