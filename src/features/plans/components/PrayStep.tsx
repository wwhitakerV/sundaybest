import { StyleSheet, View } from "react-native";

import type { StudyPrayer } from "../types";
import { PrayerHeading } from "@/entities/study";
import { space } from "@/theme";
import { StudyFollow } from "./StudyFollow";
import { StudyKicker } from "./StudyKicker";
import { StudyEnter } from "./StudyEnter";
import { SerifBody } from "@/ui/typography/SerifBody";

export type PrayStepProps = {
  dayNumber: number;
  prayer: StudyPrayer;
};

/** Daily Study's Pray step: the day's prayer. */
export function PrayStep({ dayNumber, prayer }: PrayStepProps) {
  return (
    <View testID="study-pray-body" style={styles.body}>
      <StudyKicker dayNumber={dayNumber} label="Pray" />
      <StudyEnter order={1}>
        <PrayerHeading title={prayer.title} />
      </StudyEnter>
      <StudyFollow>
        <SerifBody>{prayer.text}</SerifBody>
      </StudyFollow>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { gap: space[16] },
});
