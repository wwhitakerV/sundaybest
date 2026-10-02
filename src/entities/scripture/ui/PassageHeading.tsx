import { StyleSheet, View } from "react-native";

import { radius, space, useTheme } from "@/theme";
import { SFProBody } from "@/ui/typography/SFProBody";
import { SFProTitle } from "@/ui/typography/SFProTitle";

export type PassageHeadingProps = {
  /** "Ephesians 2:8-10". */
  reference: string;
  /** "NIV". */
  translation: string;
  testID?: string;
};

/** A passage's heading: its reference, and its translation in a pill on the right. */
export function PassageHeading({ reference, translation, testID }: PassageHeadingProps) {
  const theme = useTheme();

  return (
    <View testID={testID} style={styles.row}>
      <SFProTitle style={styles.reference}>{reference}</SFProTitle>
      <View
        testID={testID && `${testID}-translation`}
        style={[styles.pill, { borderColor: theme.colors.divider, borderRadius: radius.pill }]}
      >
        <SFProBody variant="label" tone="textInactive">
          {translation}
        </SFProBody>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: space[12],
  },
  reference: { flexShrink: 1 },
  pill: { borderWidth: 1, paddingHorizontal: space[14], paddingVertical: space[6] },
});
