import { Pressable, StyleSheet, Text, View } from "react-native";
import { BellRing } from "lucide-react-native";

import type { LocalTime } from "@/types/domain";
import { useTheme } from "@/theme";

const TIMES: readonly { time: LocalTime; label: string }[] = [
  { time: "06:30", label: "6:30" },
  { time: "07:00", label: "7:00" },
  { time: "08:00", label: "8:00" },
];

export type ReminderTimesProps = {
  /** The morning reminder's time, if it's on. */
  selected: LocalTime | null;
  onSelect: (time: LocalTime) => void;
  testID: string;
};

/** "Remind me each morning": a few times to pick from. */
export function ReminderTimes({ selected, onSelect, testID }: ReminderTimesProps) {
  const theme = useTheme();

  return (
    <View
      testID={testID}
      style={[
        styles.card,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.divider },
      ]}
    >
      <View style={styles.heading}>
        <BellRing size={22} color={theme.colors.text} strokeWidth={theme.icon.strokeWidth} />
        <Text style={[theme.typography.listItem, { color: theme.colors.text }]}>
          Remind me each morning
        </Text>
      </View>
      <View style={styles.chips} accessibilityRole="radiogroup">
        {TIMES.map(({ time, label }) => {
          const isSelected = time === selected;
          return (
            <Pressable
              key={time}
              testID={`${testID}-${time}`}
              accessibilityRole="radio"
              accessibilityLabel={`${label} AM`}
              accessibilityState={{ selected: isSelected }}
              onPress={() => onSelect(time)}
              style={[
                styles.chip,
                {
                  borderRadius: theme.radii.pill,
                  borderColor: isSelected ? theme.colors.textInactive : theme.colors.divider,
                  backgroundColor: isSelected
                    ? theme.colors.segmentBackground
                    : theme.colors.background,
                },
              ]}
            >
              <Text style={[theme.typography.body, { color: theme.colors.text }]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { alignSelf: "stretch", borderWidth: 1, borderRadius: 28, padding: 20, gap: 16 },
  heading: { flexDirection: "row", alignItems: "center", gap: 12 },
  chips: { flexDirection: "row", gap: 10 },
  chip: {
    minWidth: 72,
    minHeight: 44,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
});
