import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/theme";

export type PlanAboutProps = {
  paragraphs: readonly string[];
  testID?: string;
};

/** Plan Detail's "About this plan": a heading over a few paragraphs, for reading. */
export function PlanAbout({ paragraphs, testID }: PlanAboutProps) {
  const theme = useTheme();

  return (
    <View testID={testID} style={styles.about}>
      <Text
        accessibilityRole="header"
        style={[theme.typography.editorialHeading, { color: theme.colors.text }]}
      >
        About this plan
      </Text>
      {paragraphs.map((paragraph) => (
        <Text
          key={paragraph}
          style={[theme.typography.reading, { color: theme.colors.textInactive }]}
        >
          {paragraph}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  about: { gap: 12 },
});
