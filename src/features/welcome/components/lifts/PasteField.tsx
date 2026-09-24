import { StyleSheet, Text, View } from "react-native";
import Animated from "react-native-reanimated";
import { Check, ClipboardPaste, Link2 } from "lucide-react-native";

import { useTheme } from "@/theme";
import { usePopIn, usePressPulse } from "../../hooks/use-tap-feedback";
import { PASTE_LINK, getPasteScene } from "../../logic/scenes";
import type { LiftPieceProps } from "./lift-piece";

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
      <Text
        numberOfLines={1}
        style={[
          theme.typography.body,
          styles.text,
          { color: typed ? theme.colors.text : theme.colors.textMuted },
        ]}
      >
        {typed || "Sermon link"}
      </Text>
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
          <Text style={[theme.typography.label, { color: theme.colors.onControlPrimary }]}>
            Paste
          </Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    height: 74,
    borderWidth: 1,
    borderRadius: 37,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 22,
    paddingRight: 9,
    gap: 12,
  },
  text: { flex: 1 },
  paste: {
    height: 54,
    borderRadius: 27,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  check: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
  },
});
