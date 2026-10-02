import { StyleSheet, View } from "react-native";

import { space } from "@/theme";
import { SFProBody } from "@/ui/typography/SFProBody";
import { SFProTitle } from "@/ui/typography/SFProTitle";

export type PlansEmptyProps = {
  title: string;
  message: string;
  testID: string;
};

/** The library with nothing under the filter picked: what's missing, and how it fills. */
export function PlansEmpty({ title, message, testID }: PlansEmptyProps) {
  return (
    <View testID={testID} style={[styles.empty, { gap: space[8], paddingTop: space[40] }]}>
      <SFProTitle accessibilityRole="header">{title}</SFProTitle>
      <SFProBody tone="textMuted" style={styles.message}>
        {message}
      </SFProBody>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { alignItems: "center" },
  message: { textAlign: "center" },
});
