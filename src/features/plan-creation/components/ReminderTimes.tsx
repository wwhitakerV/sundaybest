import { Pressable, StyleSheet, View } from "react-native";
import { BellRing } from "lucide-react-native";

import type { LocalTime } from "@/types/domain";
import { controlHeight, radius, space, useTheme } from "@/theme";
import { Card } from "@/ui/atoms/Card";
import { SFProBody } from "@/ui/typography/SFProBody";

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
    <Card testID={testID} style={styles.card}>
      <View style={styles.heading}>
        <BellRing size={22} color={theme.colors.text} strokeWidth={theme.icon.strokeWidth} />
        <SFProBody variant="listItem">Remind me each morning</SFProBody>
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
                  borderRadius: radius.pill,
                  borderColor: isSelected ? theme.colors.textInactive : theme.colors.divider,
                  backgroundColor: isSelected
                    ? theme.colors.segmentBackground
                    : theme.colors.background,
                },
              ]}
            >
              <SFProBody>{label}</SFProBody>
            </Pressable>
          );
        })}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { alignSelf: "stretch", padding: space[20], gap: space[16] },
  heading: { flexDirection: "row", alignItems: "center", gap: space[12] },
  chips: { flexDirection: "row", gap: space[10] },
  chip: {
    minWidth: 72,
    minHeight: controlHeight.hitTarget,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: space[16],
  },
});
