import { StyleSheet, View } from "react-native";
import { Sparkles } from "lucide-react-native";

import { space, useTheme } from "@/theme";
import { PAGE_INSET } from "@/ui/organisms/Screen";
import { SFProBody } from "@/ui/typography/SFProBody";
import type { GenerationBarView } from "../logic/generation-bar";
import { ProgressLine } from "./ProgressLine";

/** The title's room above it, under the sheet's grabber (drawn by the sheet). */
const GRABBER_ROOM = 16;
const SPARKLE_SIZE = 24;

const TITLES = {
  building: "Creating your plan",
  ready: "Your plan is ready",
  failed: "Couldn’t create your plan",
} as const;

export type GenerationSheetHeaderProps = {
  view: GenerationBarView;
  testID: string;
};

/**
 * The generation sheet's head while building (ready and failed sheets are
 * centred instead): the sparkle, what's
 * happening, and — building — how far along it is, at the right of the
 * title and as a line under it. Drawn on the sheet's own
 * surface (`getSurfaceTheme`), so the sparkle is the accent while building
 * and the green's dark ink once ready. The step under way and everything
 * else is said in the body, at its step.
 */
export function GenerationSheetHeader({ view, testID }: GenerationSheetHeaderProps) {
  const theme = useTheme();
  const percent = view.kind === "building" ? view.percent : null;

  return (
    <View testID={testID} style={styles.head}>
      <View style={styles.titleRow}>
        <Sparkles
          size={SPARKLE_SIZE}
          color={theme.colors.accent}
          strokeWidth={theme.icon.strokeWidth}
        />
        <SFProBody variant="listItem" tone="text" accessibilityRole="header" style={styles.title}>
          {TITLES[view.kind]}
        </SFProBody>
        {percent !== null && (
          <SFProBody testID={`${testID}-percent`} variant="listItem" tone="textMuted">
            {`${percent}%`}
          </SFProBody>
        )}
      </View>
      {percent !== null && <ProgressLine percent={percent} testID={`${testID}-progress`} />}
    </View>
  );
}

const styles = StyleSheet.create({
  head: {
    paddingTop: GRABBER_ROOM,
    paddingBottom: space[8],
    paddingHorizontal: PAGE_INSET,
    gap: space[16],
  },
  titleRow: { flexDirection: "row", alignItems: "center", gap: space[12] },
  title: { flex: 1 },
});
