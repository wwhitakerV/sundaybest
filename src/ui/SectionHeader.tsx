import { Pressable, StyleSheet, Text, View } from "react-native";
import { ChevronRight } from "lucide-react-native";

import { useTheme } from "@/theme";

const CHEVRON_SIZE = 16;

export type SectionHeaderProps = {
  title: string;
  /** A link at the right, in the accent colour with a chevron — "See all". */
  action?: { label: string; onPress: () => void; testID?: string };
  testID?: string;
};

/** The heading over one section of a scrolling page, with an optional link at its right. */
export function SectionHeader({ title, action, testID }: SectionHeaderProps) {
  const theme = useTheme();

  return (
    <View testID={testID} style={styles.row}>
      <Text
        accessibilityRole="header"
        style={[theme.typography.sectionTitle, styles.title, { color: theme.colors.text }]}
      >
        {title}
      </Text>
      {action && (
        <Pressable
          testID={action.testID}
          accessibilityRole="link"
          accessibilityLabel={`${action.label}, ${title}`}
          hitSlop={theme.spacing.sm}
          onPress={action.onPress}
          style={styles.action}
        >
          <Text style={[theme.typography.label, { color: theme.colors.accent }]}>
            {action.label}
          </Text>
          <ChevronRight
            size={CHEVRON_SIZE}
            color={theme.colors.accent}
            strokeWidth={theme.icon.strokeWidth}
          />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { flexShrink: 1 },
  action: { flexDirection: "row", alignItems: "center", gap: 2 },
});
