import { Pressable, StyleSheet, View } from "react-native";
import { Sparkles, X } from "lucide-react-native";

import { radius, space, useTheme } from "@/theme";
import { SFProBody } from "@/ui/typography/SFProBody";
import type { GenerationBarView } from "../logic/generation-bar";
import { ProgressLine } from "./ProgressLine";

/** Room at the top for the sheet's own grabber, drawn by iOS. */
const GRABBER_ROOM = 28;
/** The sparkle's tile, beside the title. */
const TILE_SIZE = 52;
const SPARKLE_SIZE = 26;
/** The round close button. */
const CLOSE_SIZE = 44;
const CLOSE_ICON = 20;

const TITLES = {
  building: "Generating your plan",
  ready: "Your plan is ready",
  failed: "Couldn’t build your plan",
} as const;

export type GenerationSheetHeaderProps = {
  view: GenerationBarView;
  /** The step under way, while building ("Finding the Scripture"). */
  step: string | null;
  onClose: () => void;
  testID: string;
};

/**
 * The generation sheet's head, in the primary control's colours: the
 * accent's sparkle in its tile, what's happening, a progress line in the
 * accent while building, and a round close.
 */
export function GenerationSheetHeader({ view, step, onClose, testID }: GenerationSheetHeaderProps) {
  const theme = useTheme();
  const building = view.kind === "building";
  const percent = building ? view.percent : view.kind === "ready" ? 100 : null;
  const detail =
    view.kind === "failed"
      ? view.reason
      : building
        ? `${step ?? "Starting"} · ${view.percent}%`
        : null;

  return (
    <View testID={testID} style={[styles.head, { backgroundColor: theme.colors.controlPrimary }]}>
      <View style={styles.row}>
        <View style={[styles.tile, { backgroundColor: theme.colors.onControlPrimaryFaint }]}>
          <Sparkles
            size={SPARKLE_SIZE}
            color={theme.colors.accent}
            strokeWidth={theme.icon.strokeWidth}
          />
        </View>
        <View style={styles.words}>
          <SFProBody variant="listItem" tone="onControlPrimary" accessibilityRole="header">
            {TITLES[view.kind]}
          </SFProBody>
          {percent !== null && <ProgressLine percent={percent} testID={`${testID}-progress`} />}
          {detail && (
            <SFProBody variant="detail" tone="onControlPrimary">
              {detail}
            </SFProBody>
          )}
          {building && (
            <SFProBody variant="detail" tone="onControlPrimaryMuted">
              This keeps running while you browse.
            </SFProBody>
          )}
        </View>
        <Pressable
          testID={`${testID}-close`}
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={onClose}
          style={[styles.close, { backgroundColor: theme.colors.onControlPrimaryFaint }]}
        >
          <X
            size={CLOSE_ICON}
            color={theme.colors.onControlPrimary}
            strokeWidth={theme.icon.strokeWidth}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { paddingTop: GRABBER_ROOM, paddingBottom: space[24], paddingHorizontal: space[24] },
  row: { flexDirection: "row", alignItems: "flex-start", gap: space[16] },
  tile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    borderRadius: radius[16],
    alignItems: "center",
    justifyContent: "center",
  },
  words: { flex: 1, gap: space[8] },
  close: {
    width: CLOSE_SIZE,
    height: CLOSE_SIZE,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
});
