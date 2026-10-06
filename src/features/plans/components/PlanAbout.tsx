import { StyleSheet, View } from "react-native";

import { space } from "@/theme";
import { MonoLabel } from "@/ui/typography/MonoLabel";
import { SFProBody } from "@/ui/typography/SFProBody";
import { SerifTitle } from "@/ui/typography/SerifTitle";
import type { PlanAboutLook } from "../logic/plan-about";

export type PlanAboutProps = PlanAboutLook & {
  testID?: string;
};

/**
 * Plan Overview's "About this plan": the overview, then the Scriptures the
 * sermon references and its key takeaways.
 */
export function PlanAbout({ overview, scriptures, takeaways, testID }: PlanAboutProps) {
  return (
    <View testID={testID} style={styles.about}>
      <View style={styles.section}>
        <SerifTitle accessibilityRole="header">About this plan</SerifTitle>
        {overview.map((paragraph) => (
          <SFProBody variant="reading" tone="textInactive" key={paragraph}>
            {paragraph}
          </SFProBody>
        ))}
      </View>

      {scriptures.length > 0 && (
        <AboutList
          testID={testID && `${testID}-scriptures`}
          itemTestID={testID && `${testID}-scripture`}
          label="Scriptures referenced"
          items={scriptures}
        />
      )}

      <AboutList
        testID={testID && `${testID}-takeaways`}
        itemTestID={testID && `${testID}-takeaway`}
        label="Key takeaways"
        items={takeaways}
      />
    </View>
  );
}

type AboutListProps = {
  label: string;
  items: readonly string[];
  testID: string | undefined;
  itemTestID: string | undefined;
};

/** One labelled list inside About this plan. */
function AboutList({ label, items, testID, itemTestID }: AboutListProps) {
  return (
    <View testID={testID} style={styles.list}>
      <MonoLabel variant="labelTracked" tone="textMuted" style={styles.label}>
        {label}
      </MonoLabel>
      {items.map((item) => (
        <SFProBody variant="listItem" tone="text" key={item} testID={itemTestID}>
          {item}
        </SFProBody>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  about: { gap: space[32] },
  section: { gap: space[12] },
  list: { gap: space[8] },
  label: { textTransform: "uppercase" },
});
