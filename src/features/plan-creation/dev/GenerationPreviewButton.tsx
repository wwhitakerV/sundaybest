import { Pressable, StyleSheet } from "react-native";
import { FlaskConical } from "lucide-react-native";

import { radius, space, useTheme } from "@/theme";
import { SFProLabel } from "@/ui/typography/SFProLabel";
import { cyclePreview, useGenerationPreview } from "./generation-preview";

const ICON_SIZE = 14;
/** Small and out of the way: a development switch, not part of the design. */
const HEIGHT = 30;

/**
 * DEVELOPMENT ONLY — remove with `generation-preview.ts`. Steps the
 * generation bar and its sheet through each state they can be in, one tap at
 * a time, then off. Draws nothing outside development.
 */
export function GenerationPreviewButton({ testID }: { testID: string }) {
  const theme = useTheme();
  const preview = useGenerationPreview();
  if (!__DEV__) return null;

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel="Preview the next generation state"
      onPress={cyclePreview}
      hitSlop={space[8]}
      style={[
        styles.pill,
        { backgroundColor: theme.colors.background, borderColor: theme.colors.borderStrong },
      ]}
    >
      <FlaskConical
        size={ICON_SIZE}
        color={theme.colors.text}
        strokeWidth={theme.icon.strokeWidth}
      />
      <SFProLabel tone="text">{preview ? preview.label : "Preview build"}</SFProLabel>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    height: HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    gap: space[6],
    paddingHorizontal: space[12],
    borderRadius: radius.pill,
    borderWidth: 1,
    alignSelf: "center",
  },
});
