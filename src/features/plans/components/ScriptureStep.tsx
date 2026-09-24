import { StyleSheet, Text, View } from "react-native";

import type { ScripturePassage } from "@/types/domain";
import { useTheme } from "@/theme";
import { StudyFollow, type FollowStyle } from "./StudyFollow";
import { StudyKicker } from "./StudyKicker";

export type ScriptureStepProps = {
  dayNumber: number;
  passage: ScripturePassage;
  /** Brings the verses in a beat after the reference. */
  followStyle?: FollowStyle;
};

/** Daily Study's Scripture step: the day's passage, in its translation, verse by verse. */
export function ScriptureStep({ dayNumber, passage, followStyle }: ScriptureStepProps) {
  const theme = useTheme();

  return (
    <View testID="study-scripture-body" style={styles.body}>
      <StudyKicker dayNumber={dayNumber} label="Scripture" />
      <View style={styles.titleRow}>
        <Text
          style={[theme.typography.screenTitle, styles.reference, { color: theme.colors.text }]}
        >
          {passage.reference}
        </Text>
        <View
          style={[
            styles.pill,
            { borderColor: theme.colors.divider, borderRadius: theme.radii.pill },
          ]}
        >
          <Text style={[theme.typography.label, { color: theme.colors.textInactive }]}>
            {passage.translation}
          </Text>
        </View>
      </View>
      <StudyFollow style={followStyle}>
        <View
          style={[
            styles.card,
            { backgroundColor: theme.colors.background, borderColor: theme.colors.divider },
          ]}
        >
          <Text
            testID="study-scripture-verses"
            style={[theme.typography.scripture, { color: theme.colors.text }]}
          >
            {passage.verses.map((verse) => (
              <Text key={verse.number}>
                <Text style={theme.typography.metaEmphasis}>{`${verse.number} `}</Text>
                {`${verse.text} `}
              </Text>
            ))}
          </Text>
        </View>
      </StudyFollow>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { gap: 16 },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  reference: { flexShrink: 1 },
  pill: { borderWidth: 1, paddingHorizontal: 14, paddingVertical: 6 },
  card: { borderWidth: 1, borderRadius: 24, paddingHorizontal: 22, paddingVertical: 18 },
});
