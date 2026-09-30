import { Pressable, StyleSheet, Text } from "react-native";
import type { LucideIcon } from "lucide-react-native";

import { IconBadge } from "@/ui/IconBadge";
import { RadioMark } from "@/ui/RadioMark";
import { useTheme } from "@/theme";

/** The accent's rule down a picked option's leading edge; other edges are a hairline. */
const LEAD_EDGE = 3;
const EDGE = 1;
const MIN_HEIGHT = 64;

export type ModeCardProps = {
  icon: LucideIcon;
  /** "Exam", "Study". */
  title: string;
  /** What it's like, for VoiceOver — shown under the choice while it's picked. */
  line: string;
  detail: string;
  selected: boolean;
  onSelect: () => void;
  testID: string;
};

/**
 * One way to take an exam, as one of two options side by side: a rounded
 * square with its icon in a badge, its name, and a radio mark — so it never
 * reads as one of the page's pill buttons. Picked, it's washed in the
 * selection's blush with the accent down its leading edge. What it's like
 * is said under the choice, and to VoiceOver on the option itself.
 */
export function ModeCard({ icon, title, line, detail, selected, onSelect, testID }: ModeCardProps) {
  const theme = useTheme();

  return (
    <Pressable
      testID={testID}
      accessibilityRole="radio"
      accessibilityLabel={`${title}. ${line} ${detail}`}
      accessibilityState={{ checked: selected }}
      onPress={onSelect}
      style={[
        styles.option,
        {
          backgroundColor: selected ? theme.colors.selectionSurface : theme.colors.background,
          borderColor: selected ? theme.colors.selectionBorder : theme.colors.border,
          borderLeftColor: selected ? theme.colors.accent : theme.colors.border,
          borderLeftWidth: selected ? LEAD_EDGE : EDGE,
          borderRadius: theme.radii.lg,
          padding: theme.spacing.md,
          // Holds the words still as the leading edge thickens.
          paddingLeft: theme.spacing.md - (selected ? LEAD_EDGE - EDGE : 0),
          gap: theme.spacing.sm,
        },
      ]}
    >
      <IconBadge icon={icon} selected={selected} />
      <Text
        numberOfLines={1}
        style={[theme.typography.tileTitle, styles.title, { color: theme.colors.text }]}
      >
        {title}
      </Text>
      <RadioMark selected={selected} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  option: {
    flex: 1,
    minHeight: MIN_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: EDGE,
  },
  title: { flex: 1 },
});
