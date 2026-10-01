import { StyleSheet, View } from "react-native";

import type { ScripturePassage } from "@/types/domain";
import { radius, space, useTheme } from "@/theme";
import { Card } from "@/ui/atoms/Card";
import { StudyFollow, type FollowStyle } from "./StudyFollow";
import { StudyKicker } from "./StudyKicker";
import { StudyDriftIn } from "./StudyDriftIn";
import { SFProBody } from "@/ui/typography/SFProBody";
import { SFProTitle } from "@/ui/typography/SFProTitle";
import { SerifBody } from "@/ui/typography/SerifBody";
import { MonoLabel } from "@/ui/typography/MonoLabel";
import { Span } from "@/ui/typography/Span";

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
      <StudyDriftIn order={1}>
        <View style={styles.titleRow}>
          <SFProTitle style={styles.reference}>{passage.reference}</SFProTitle>
          <View
            style={[styles.pill, { borderColor: theme.colors.divider, borderRadius: radius.pill }]}
          >
            <SFProBody variant="label" tone="textInactive">
              {passage.translation}
            </SFProBody>
          </View>
        </View>
      </StudyDriftIn>
      <StudyFollow style={followStyle}>
        <Card radius={24} fill="page" style={styles.card}>
          <SerifBody testID="study-scripture-verses">
            {passage.verses.map((verse) => (
              <Span key={verse.number}>
                <MonoLabel variant="emphasis">{`${verse.number} `}</MonoLabel>
                {`${verse.text} `}
              </Span>
            ))}
          </SerifBody>
        </Card>
      </StudyFollow>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { gap: space[16] },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: space[12],
  },
  reference: { flexShrink: 1 },
  pill: { borderWidth: 1, paddingHorizontal: space[14], paddingVertical: space[6] },
  card: { paddingHorizontal: space[22], paddingVertical: space[18] },
});
