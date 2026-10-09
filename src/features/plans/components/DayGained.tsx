import { View } from "react-native";

import { PassageHeading } from "@/entities/scripture";
import { space } from "@/theme";
import { Divider } from "@/ui/atoms/Divider";
import { SerifBody } from "@/ui/typography/SerifBody";
import { SFProBody } from "@/ui/typography/SFProBody";

/** The key verse reads whole in four lines; what was written, its first three. */
const VERSE_LINES = 4;
const WROTE_LINES = 3;

export type DayGainedProps = {
  reference: string;
  translation: string;
  verse: string | null;
  /** The first thing written in the day's reflection, from this phone — or null. */
  wrote: string | null;
  testID: string;
};

/**
 * What a finished day gave, as Progress's day panel shows a day: the
 * passage's heading, its key verse in quotes, and what the reader wrote.
 */
export function DayGained({ reference, translation, verse, wrote, testID }: DayGainedProps) {
  return (
    <View testID={testID} style={{ gap: space[16] }}>
      <PassageHeading reference={reference} translation={translation} />
      {verse && (
        <SerifBody variant="scripture" numberOfLines={VERSE_LINES}>
          {`“${verse}”`}
        </SerifBody>
      )}
      {wrote && (
        <View style={{ gap: space[8] }}>
          <Divider style={{ marginBottom: space[8] }} />
          <SFProBody variant="detail" tone="textMuted">
            You wrote
          </SFProBody>
          <SerifBody variant="standfirst" tone="text" numberOfLines={WROTE_LINES}>
            {wrote}
          </SerifBody>
        </View>
      )}
    </View>
  );
}
