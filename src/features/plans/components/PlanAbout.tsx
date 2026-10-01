import { StyleSheet, View } from "react-native";

import { space } from "@/theme";
import { SFProBody } from "@/ui/typography/SFProBody";
import { SerifTitle } from "@/ui/typography/SerifTitle";

export type PlanAboutProps = {
  paragraphs: readonly string[];
  testID?: string;
};

/** Plan Detail's "About this plan": a heading over a few paragraphs, for reading. */
export function PlanAbout({ paragraphs, testID }: PlanAboutProps) {
  return (
    <View testID={testID} style={styles.about}>
      <SerifTitle accessibilityRole="header">About this plan</SerifTitle>
      {paragraphs.map((paragraph) => (
        <SFProBody variant="reading" tone="textInactive" key={paragraph}>
          {paragraph}
        </SFProBody>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  about: { gap: space[12] },
});
