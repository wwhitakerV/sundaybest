import { StyleSheet, View } from "react-native";

import { space } from "@/theme";
import { SFProBody } from "@/ui/typography/SFProBody";
import { SFProTitle } from "@/ui/typography/SFProTitle";

export type PlansEmptyProps = {
  title: string;
  message: string;
  /** In a page of its own (the search): a smaller title, and no room above it — its page places it. */
  compact?: boolean;
  testID: string;
};

/** The library with nothing under the filter picked: what's missing, and how it fills. */
export function PlansEmpty({ title, message, compact = false, testID }: PlansEmptyProps) {
  return (
    <View
      testID={testID}
      style={[styles.empty, { gap: space[8], paddingTop: compact ? 0 : space[40] }]}
    >
      <SFProTitle accessibilityRole="header" {...(compact && { variant: "message" as const })}>
        {title}
      </SFProTitle>
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
