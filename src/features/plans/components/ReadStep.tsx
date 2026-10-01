import { StyleSheet, View } from "react-native";

import type { DayReading } from "@/types/domain";
import { SermonClipCard } from "./SermonClipCard";
import { StudyFollow, type FollowStyle } from "./StudyFollow";
import { StudyKicker } from "./StudyKicker";
import { StudyDriftIn } from "./StudyDriftIn";
import { space } from "@/theme";
import { DisplayTitle } from "@/ui/typography/DisplayTitle";
import { SFProBody } from "@/ui/typography/SFProBody";

export type ReadStepProps = {
  dayNumber: number;
  reading: DayReading;
  /** Brings the reading in a beat after its title. */
  followStyle?: FollowStyle;
};

/** Daily Study's Read step: the day's reading, and where it comes from in the sermon. */
export function ReadStep({ dayNumber, reading, followStyle }: ReadStepProps) {
  return (
    <View testID="study-read-body" style={styles.body}>
      <StudyKicker dayNumber={dayNumber} label="Read" />
      <StudyDriftIn order={1}>
        <DisplayTitle>{reading.title}</DisplayTitle>
      </StudyDriftIn>
      <StudyFollow style={followStyle}>
        {reading.paragraphs.map((paragraph) => (
          <SFProBody variant="reading" tone="textInactive" key={paragraph}>
            {paragraph}
          </SFProBody>
        ))}
        {reading.sermonClip && <SermonClipCard startSeconds={reading.sermonClip.startSeconds} />}
      </StudyFollow>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { gap: space[16] },
});
