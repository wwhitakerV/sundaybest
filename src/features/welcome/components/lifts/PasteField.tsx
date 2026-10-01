import { StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";
import { Check, ClipboardPaste, Link2 } from "lucide-react-native";

import { space, useTheme } from "@/theme";
import { usePopIn, usePressPulse } from "../../hooks/use-tap-feedback";
import { PASTE_LINK, getPasteScene } from "../../logic/scenes";
import type { LiftPieceProps } from "../../logic/lift-piece";
import { SFProBody } from "@/ui/typography/SFProBody";

/**
 * The sermon-link field. As its scene plays, Paste is tapped, the link
 * types in, and a check pops in where the button was.
 */
export function PasteField({ elapsedMs }: LiftPieceProps) {
  const theme = useTheme();
  const scene = getPasteScene(elapsedMs);
  const pasteStyle = usePressPulse(scene.tapped);
  const checkStyle = usePopIn(scene.complete);
  const typed = PASTE_LINK.slice(0, scene.typedChars);

  return (
    <View
      style={[
        styles.field,
        { backgroundColor: theme.colors.background, borderColor: theme.colors.divider },
      ]}
    >
      <Link2 size={22} color={theme.colors.textMuted} strokeWidth={theme.icon.strokeWidth} />
      <SFProBody tone={typed ? "text" : "textMuted"} style={styles.text} numberOfLines={1}>
        {typed || "Sermon link"}
      </SFProBody>
      {scene.complete ? (
        <Animated.View
          style={[styles.check, { backgroundColor: theme.colors.segmentBackground }, checkStyle]}
        >
          <Check size={22} color={theme.colors.selected} strokeWidth={2.5} />
        </Animated.View>
      ) : (
        <Animated.View
          style={[styles.paste, { backgroundColor: theme.colors.controlPrimary }, pasteStyle]}
        >
          <ClipboardPaste
            size={18}
            color={theme.colors.onControlPrimary}
            strokeWidth={theme.icon.strokeWidth}
          />
          <SFProBody variant="label" tone="onControlPrimary">
            Paste
          </SFProBody>
        </Animated.View>
      )}
    </View>
  );
}

/** Its corners — shared with the floating card it lifts onto. */
export const PASTE_FIELD_RADIUS = 37;

/** The Paste button (and the tick that replaces it): a full-round 54. */
const BUTTON_SIZE = 54;
/** Inset from the field's end, so the button sits concentric with its round corner. */
const FIELD_END = 9;

const styles = StyleSheet.create({
  field: {
    height: 74,
    borderWidth: 1,
    borderRadius: PASTE_FIELD_RADIUS,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: space[22],
    paddingRight: FIELD_END,
    gap: space[12],
  },
  text: { flex: 1 },
  paste: {
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    paddingHorizontal: space[18],
    flexDirection: "row",
    alignItems: "center",
    gap: space[8],
  },
  check: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
  },
});
