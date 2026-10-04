import { StyleSheet, View } from "react-native";

import type { StudyScripture } from "../types";
import { PassageCard, PassageHeading } from "@/entities/scripture";
import { space } from "@/theme";
import { StudyFollow, type FollowStyle } from "./StudyFollow";
import { StudyKicker } from "./StudyKicker";
import { StudyDriftIn } from "./StudyDriftIn";
import { MonoLabel } from "@/ui/typography/MonoLabel";
import { Span } from "@/ui/typography/Span";

export type ScriptureStepProps = {
  dayNumber: number;
  passage: StudyScripture;
  /** Brings the verses in a beat after the reference. */
  followStyle?: FollowStyle;
};

/** Daily Study's Scripture step: the day's passage, in its translation, verse by verse. */
export function ScriptureStep({ dayNumber, passage, followStyle }: ScriptureStepProps) {
  return (
    <View testID="study-scripture-body" style={styles.body}>
      <StudyKicker dayNumber={dayNumber} label="Scripture" />
      <StudyDriftIn order={1}>
        <PassageHeading reference={passage.reference} translation={passage.translation} />
      </StudyDriftIn>
      <StudyFollow style={followStyle}>
        <PassageCard testID="study-scripture-verses">
          {passage.verses.map((verse) => (
            <Span key={verse.number}>
              <MonoLabel variant="emphasis">{`${verse.number} `}</MonoLabel>
              {`${verse.text} `}
            </Span>
          ))}
        </PassageCard>
      </StudyFollow>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { gap: space[16] },
});
