import { Pressable, StyleSheet, Text } from "react-native";
import { ArrowUpRight } from "lucide-react-native";

import { useTheme } from "@/theme";

const ICON_SIZE = 14;
/** Lifts the hit target to 44pt without making the words look any bigger. */
const HIT_SLOP = 12;

export type LinkButtonProps = {
  label: string;
  onPress: () => void;
  /** What happens, for a screen reader: "Opens in Safari". */
  accessibilityHint?: string;
  testID?: string;
};

/** A link to somewhere outside the app: its words in the meta face, and an arrow up and out. */
export function LinkButton({ label, onPress, accessibilityHint, testID }: LinkButtonProps) {
  const theme = useTheme();

  return (
    <Pressable
      testID={testID}
      accessibilityRole="link"
      accessibilityLabel={label}
      {...(accessibilityHint !== undefined && { accessibilityHint })}
      hitSlop={HIT_SLOP}
      onPress={onPress}
      style={[styles.link, { gap: theme.spacing.xs }]}
    >
      <Text style={[theme.typography.metaLabel, styles.words, { color: theme.colors.text }]}>
        {label}
      </Text>
      <ArrowUpRight
        size={ICON_SIZE}
        color={theme.colors.text}
        strokeWidth={theme.icon.strokeWidth}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  link: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start" },
  words: { textDecorationLine: "underline" },
});
