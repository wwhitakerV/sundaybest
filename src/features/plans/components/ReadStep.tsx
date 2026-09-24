import { StyleSheet, Text, View } from "react-native";

import type { DayReading } from "@/types/domain";
import { useTheme } from "@/theme";
import { SermonClipCard } from "./SermonClipCard";
import { StudyFollow, type FollowStyle } from "./StudyFollow";
import { StudyKicker } from "./StudyKicker";

export type ReadStepProps = {
  dayNumber: number;
  reading: DayReading;
  /** Brings the reading in a beat after its title. */
  followStyle?: FollowStyle;
};

/** Daily Study's Read step: the day's reading, and where it comes from in the sermon. */
export function ReadStep({ dayNumber, reading, followStyle }: ReadStepProps) {
  const theme = useTheme();

  return (
    <View testID="study-read-body" style={styles.body}>
      <StudyKicker dayNumber={dayNumber} label="Read" />
      <Text style={[theme.typography.display, { color: theme.colors.text }]}>{reading.title}</Text>
      <StudyFollow style={followStyle}>
        {reading.paragraphs.map((paragraph) => (
          <Text
            key={paragraph}
            style={[theme.typography.reading, { color: theme.colors.textInactive }]}
          >
            {paragraph}
          </Text>
        ))}
        {reading.sermonClip && <SermonClipCard startSeconds={reading.sermonClip.startSeconds} />}
      </StudyFollow>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { gap: 16 },
});
