import { StyleSheet, Text, View } from "react-native";

import { Button } from "@/ui/Button";
import { useTheme } from "@/theme";

export type ExamUnavailableProps = {
  message: string;
  actionLabel: string;
  onAction: () => void;
  testID: string;
};

/** Where an attempt or question that isn't there would be: says so plainly, and offers the way out. */
export function ExamUnavailable({ message, actionLabel, onAction, testID }: ExamUnavailableProps) {
  const theme = useTheme();

  return (
    <View testID={testID} style={[styles.body, { gap: theme.spacing.lg }]}>
      <Text style={[theme.typography.body, styles.centred, { color: theme.colors.textInactive }]}>
        {message}
      </Text>
      <Button
        testID={`${testID}-button`}
        label={actionLabel}
        variant="secondary"
        onPress={onAction}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, justifyContent: "center" },
  centred: { textAlign: "center" },
});
