import { StyleSheet, View } from "react-native";

import type { Prayer } from "@/types/domain";
import { PrayerHeading } from "@/entities/study";
import { space } from "@/theme";
import { StudyFollow, type FollowStyle } from "./StudyFollow";
import { StudyKicker } from "./StudyKicker";
import { StudyDriftIn } from "./StudyDriftIn";
import { SerifBody } from "@/ui/typography/SerifBody";

export type PrayStepProps = {
  dayNumber: number;
  prayer: Prayer;
  /** Brings the prayer in a beat after its title. */
  followStyle?: FollowStyle;
};

/** Daily Study's Pray step: the day's prayer. */
export function PrayStep({ dayNumber, prayer, followStyle }: PrayStepProps) {
  return (
    <View testID="study-pray-body" style={styles.body}>
      <StudyKicker dayNumber={dayNumber} label="Pray" />
      <StudyDriftIn order={1}>
        <PrayerHeading title={prayer.title} />
      </StudyDriftIn>
      <StudyFollow style={followStyle}>
        <SerifBody>{prayer.text}</SerifBody>
      </StudyFollow>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { gap: space[16] },
});
