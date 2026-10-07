import { StyleSheet, View } from "react-native";

import type { StudyScripture } from "../types";
import { PassageCard, PassageHeading } from "@/entities/scripture";
import { space } from "@/theme";
import { StudyFollow } from "./StudyFollow";
import { StudyKicker } from "./StudyKicker";
import { StudyEnter } from "./StudyEnter";
import { MonoLabel } from "@/ui/typography/MonoLabel";
import { Span } from "@/ui/typography/Span";

export type ScriptureStepProps = {
  dayNumber: number;
  passage: StudyScripture;
};

/** Daily Study's Scripture step: the day's passage, in its translation, verse by verse. */
export function ScriptureStep({ dayNumber, passage }: ScriptureStepProps) {
  return (
    <View testID="study-scripture-body" style={styles.body}>
      <StudyKicker dayNumber={dayNumber} label="Scripture" />
      <StudyEnter order={1}>
        <PassageHeading reference={passage.reference} translation={passage.translation} />
      </StudyEnter>
      <StudyFollow>
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
