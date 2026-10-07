import { StyleSheet, View } from "react-native";

import type { ApiReadingParagraph } from "@/core/api/contracts";
import type { StudyReading } from "../types";
import { SermonClipCard } from "@/entities/sermon";
import { StudyFollow } from "./StudyFollow";
import { StudyKicker } from "./StudyKicker";
import { StudyEnter } from "./StudyEnter";
import { space } from "@/theme";
import { formatDuration } from "@/utils/time/formatDuration";
import { DisplayTitle } from "@/ui/typography/DisplayTitle";
import { SerifTitle } from "@/ui/typography/SerifTitle";
import { SFProBody } from "@/ui/typography/SFProBody";
import { SFProTitle } from "@/ui/typography/SFProTitle";
import { splitReadingSections } from "../logic/reading-sections";

export type ReadStepProps = {
  dayNumber: number;
  reading: StudyReading;
  /** The day's passage — where the reading's Scripture study starts (its paragraph is headed by it). */
  passageReference: string;
};

/**
 * Daily Study's Read step: the day's reading under "Read", each paragraph
 * beneath its own heading, then — from the paragraph headed by the day's
 * passage — its study under "Scripture study", and where it comes from in the
 * sermon. A plan written before headings reads as it always did.
 */
export function ReadStep({ dayNumber, reading, passageReference }: ReadStepProps) {
  const { read, study } = splitReadingSections(reading.paragraphs, passageReference);

  return (
    <View testID="study-read-body" style={styles.body}>
      <StudyKicker dayNumber={dayNumber} label="Read" />
      <StudyEnter order={1}>
        <DisplayTitle>{reading.title}</DisplayTitle>
      </StudyEnter>
      <StudyFollow>
        <ReadSection title="Read" paragraphs={read} testID="study-read-reading" />
        {study.length > 0 && (
          <ReadSection
            title="Scripture study"
            paragraphs={study}
            testID="study-read-scripture-study"
          />
        )}
        {reading.sermonClip && (
          <SermonClipCard playing={false} clock={formatDuration(reading.sermonClip.startSeconds)} />
        )}
      </StudyFollow>
    </View>
  );
}

/** One part of the reading, under its section heading: its paragraphs, each under its own. */
function ReadSection({
  title,
  paragraphs,
  testID,
}: {
  title: string;
  paragraphs: readonly ApiReadingParagraph[];
  testID: string;
}) {
  return (
    <View testID={testID} style={styles.section}>
      <SerifTitle variant="title" accessibilityRole="header">
        {title}
      </SerifTitle>
      {paragraphs.map(({ heading, content }) => (
        <View key={`${heading ?? ""}${content}`} style={styles.paragraph}>
          {heading !== null && (
            <SFProTitle variant="step" testID="study-read-paragraph-heading">
              {heading}
            </SFProTitle>
          )}
          <SFProBody variant="reading" tone="textInactive">
            {content}
          </SFProBody>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  body: { gap: space[16] },
  section: { gap: space[16] },
  paragraph: { gap: space[6] },
});
