import { StyleSheet, View } from "react-native";

import { radius, space, useTheme } from "@/theme";
import { MonoLabel } from "@/ui/typography/MonoLabel";
import { SerifBody } from "@/ui/typography/SerifBody";
import { SerifTitle } from "@/ui/typography/SerifTitle";
import { SFProBody } from "@/ui/typography/SFProBody";
import type { PlanAboutLook } from "../logic/plan-about";
import { TakeawayDeck } from "./TakeawayDeck";

/** The short accent rule that opens the section, as a magazine marks a new one. */
const RULE = { width: 28, height: 3 } as const;

export type PlanAboutProps = PlanAboutLook & {
  testID?: string;
};

/**
 * Plan Overview's "About this plan", set as a magazine feature: an accent
 * rule and the serif heading; the overview's first paragraph as a standfirst
 * and the rest under it; the Scriptures the sermon references as chips; and
 * the key takeaways dealt one to a card, swiped through one at a time.
 */
export function PlanAbout({ overview, scriptures, takeaways, testID }: PlanAboutProps) {
  return (
    <View testID={testID} style={styles.about}>
      <Overview overview={overview} testID={testID} />
      {scriptures.length > 0 && <Scriptures scriptures={scriptures} testID={testID} />}
      <Takeaways takeaways={takeaways} testID={testID} />
    </View>
  );
}

/** The opener: the rule, the heading, the standfirst, then the rest of the overview. */
function Overview({
  overview,
  testID,
}: {
  overview: readonly string[];
  testID?: string | undefined;
}) {
  const theme = useTheme();
  const [standfirst, ...rest] = overview;

  return (
    <View style={styles.overview}>
      <View
        testID={testID && `${testID}-rule`}
        style={[styles.rule, { backgroundColor: theme.colors.accent }]}
      />
      <SerifTitle accessibilityRole="header">About this plan</SerifTitle>
      {standfirst !== undefined && (
        <SerifBody variant="standfirst" tone="text" testID={testID && `${testID}-standfirst`}>
          {standfirst}
        </SerifBody>
      )}
      {rest.map((paragraph) => (
        <SFProBody variant="reading" tone="textInactive" key={paragraph}>
          {paragraph}
        </SFProBody>
      ))}
    </View>
  );
}

/** A list's small tracked label, with how many it holds beside it in the accent. */
function SectionLabel({
  label,
  count,
  testID,
}: {
  label: string;
  count?: number;
  testID?: string | undefined;
}) {
  return (
    <View style={styles.labelRow}>
      <MonoLabel variant="labelTracked" tone="textMuted" style={styles.label}>
        {label}
      </MonoLabel>
      {count !== undefined && (
        <MonoLabel variant="labelTracked" tone="accent" testID={testID}>
          {String(count)}
        </MonoLabel>
      )}
    </View>
  );
}

/** The Scriptures the sermon references, each a chip, in the sermon's order. */
function Scriptures({
  scriptures,
  testID,
}: {
  scriptures: readonly string[];
  testID?: string | undefined;
}) {
  const theme = useTheme();

  return (
    <View testID={testID && `${testID}-scriptures`} style={styles.list}>
      <SectionLabel
        label="Scriptures referenced"
        count={scriptures.length}
        testID={testID && `${testID}-scriptures-count`}
      />
      <View style={styles.chips}>
        {scriptures.map((reference) => (
          <View
            key={reference}
            testID={testID && `${testID}-scripture-chip`}
            style={[
              styles.chip,
              {
                backgroundColor: theme.colors.segmentBackground,
                borderColor: theme.colors.containerBorder,
              },
            ]}
          >
            <SFProBody variant="label" tone="text" testID={testID && `${testID}-scripture`}>
              {reference}
            </SFProBody>
          </View>
        ))}
      </View>
    </View>
  );
}

/** The key takeaways, dealt one to a card (`TakeawayDeck`). */
function Takeaways({
  takeaways,
  testID,
}: {
  takeaways: readonly string[];
  testID?: string | undefined;
}) {
  return (
    <View testID={testID && `${testID}-takeaways`} style={styles.list}>
      <SectionLabel label="Key takeaways" />
      <TakeawayDeck takeaways={takeaways} testID={testID} />
    </View>
  );
}

const styles = StyleSheet.create({
  about: { gap: space[40] },
  overview: { gap: space[16] },
  rule: { width: RULE.width, height: RULE.height, borderRadius: radius.pill },
  list: { gap: space[14] },
  labelRow: { flexDirection: "row", alignItems: "baseline", gap: space[8] },
  label: { textTransform: "uppercase" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: space[8] },
  chip: {
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: space[14],
    paddingVertical: space[8],
  },
});
