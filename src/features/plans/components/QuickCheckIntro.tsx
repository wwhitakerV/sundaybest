import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/theme";

export type QuickCheckIntroProps = {
  title: string;
  questionCount: number;
};

/** A Quick Check not started yet: what it is and how long, before Start. */
export function QuickCheckIntro({ title, questionCount }: QuickCheckIntroProps) {
  const theme = useTheme();

  return (
    <View testID="quick-check-intro" style={styles.body}>
      <Text style={[theme.typography.metaBody, { color: theme.colors.textMuted }]}>
        {`${questionCount} ${questionCount === 1 ? "question" : "questions"}`}
      </Text>
      <Text style={[theme.typography.screenTitle, { color: theme.colors.text }]}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { gap: 16 },
});
