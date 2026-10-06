import { StyleSheet, View } from "react-native";

import { space } from "@/theme";
import { SFProBody } from "@/ui/typography/SFProBody";
import type { GenerationBarView } from "../logic/generation-bar";
import { ProgressLine } from "./ProgressLine";

/** The bar's words — and, while building, its progress line — to the right of the divider. */
export function GenerationBarContent({
  view,
  testID,
}: {
  view: GenerationBarView;
  testID: string;
}) {
  if (view.kind === "building") {
    const count = view.more + 1;
    return (
      <View style={styles.stack}>
        <View style={styles.titleRow}>
          <SFProBody
            variant="listItem"
            tone="onControlPrimary"
            numberOfLines={1}
            style={styles.title}
          >
            {count === 1 ? "Generating plan" : `Generating ${count} plans`}
          </SFProBody>
          <SFProBody variant="detail" tone="onControlPrimaryMuted">{`${view.percent}%`}</SFProBody>
        </View>
        <View style={styles.line}>
          <ProgressLine percent={view.percent} testID={`${testID}-progress`} />
        </View>
      </View>
    );
  }
  const ready = view.kind === "ready";
  return (
    <View style={styles.stack}>
      <SFProBody
        variant="listItem"
        tone={ready ? "onSuccess" : "onControlPrimary"}
        numberOfLines={1}
      >
        {ready ? "Your plan is ready" : "Couldn’t build your plan"}
      </SFProBody>
      <SFProBody
        variant="detail"
        tone={ready ? "onSuccessMuted" : "onControlPrimaryMuted"}
        numberOfLines={1}
      >
        {ready ? view.title : view.reason}
      </SFProBody>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: space[4] },
  titleRow: { flexDirection: "row", alignItems: "baseline", gap: space[8] },
  title: { flexShrink: 1 },
  line: { marginTop: space[4] },
});
