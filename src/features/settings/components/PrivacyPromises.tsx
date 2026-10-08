import { Fragment } from "react";
import { StyleSheet, View } from "react-native";

import { space } from "@/theme";
import { Divider } from "@/ui/atoms/Divider";
import { MonoLabel } from "@/ui/typography/MonoLabel";
import { SFProTitle } from "@/ui/typography/SFProTitle";

/** Wide enough for "03", so every promise starts in line. */
const INDEX_WIDTH = 32;

/** SundayBest's strongest privacy promises, first and plain: numbered, with hairlines between. */
export function PrivacyPromises({
  promises,
  testID,
}: {
  promises: readonly string[];
  testID: string;
}) {
  return (
    <View testID={testID}>
      {promises.map((promise, index) => (
        <Fragment key={promise}>
          {index > 0 && <Divider />}
          <View style={[styles.row, { paddingVertical: space[16] }]}>
            <MonoLabel variant="label" tone="textMuted" style={styles.index}>
              {String(index + 1).padStart(2, "0")}
            </MonoLabel>
            <SFProTitle variant="smallCardTitle" style={styles.copy}>
              {promise}
            </SFProTitle>
          </View>
        </Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "baseline" },
  index: { width: INDEX_WIDTH },
  copy: { flex: 1 },
});
