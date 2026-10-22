import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Lightbulb, Share2 } from "lucide-react-native";

import { ThemeScope, getSurfaceTheme, space, useTheme } from "@/theme";
import { Button } from "@/ui/atoms/Button";
import { RoundIconButton } from "@/ui/atoms/RoundIconButton";
import { PAGE_INSET } from "@/ui/organisms/Screen";
import { SerifTitle } from "@/ui/typography/SerifTitle";
import { SFProBody } from "@/ui/typography/SFProBody";

export type RiseFinishProps = {
  result: { headline: string; time: string; line: string };
  onLearned: () => void;
  onShare: () => void;
};

/**
 * Over the foot of the finished board — the atmosphere above left as the
 * run made it — on black, edge to edge and down past the screen's foot
 * (the primary surface: white words, the button turned white, faint white
 * edges): the score, how many rose and burst, what was learned, and Share.
 */
export function RiseFinish(props: RiseFinishProps) {
  const theme = useTheme();
  return (
    <ThemeScope theme={getSurfaceTheme(theme, "primary")}>
      <FinishPanel {...props} />
    </ThemeScope>
  );
}

/** The panel itself, drawn in the surface's colours. */
function FinishPanel({ result, onLearned, onShare }: RiseFinishProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      testID="rise-result"
      style={[
        styles.foot,
        { backgroundColor: colors.background, paddingBottom: insets.bottom + space[16] },
      ]}
    >
      <View style={styles.words}>
        <View style={styles.scoreLine}>
          <SerifTitle variant="feature" accessibilityRole="header">
            {result.headline}
          </SerifTitle>
          <SerifTitle variant="feature" tone="textMuted" testID="rise-time">
            {result.time}
          </SerifTitle>
        </View>
        <SFProBody variant="rowDetail" tone="textMuted">
          {result.line}
        </SFProBody>
      </View>
      <View style={styles.actions}>
        <View style={styles.learned}>
          <Button
            testID="rise-learned"
            label="What you learned"
            icon={Lightbulb}
            onPress={onLearned}
          />
        </View>
        <RoundIconButton
          testID="rise-share"
          icon={Share2}
          accessibilityLabel="Share"
          onPress={onShare}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  foot: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: PAGE_INSET,
    paddingTop: space[24],
    gap: space[20],
  },
  words: { gap: space[4] },
  // The score, and opposite it the time to spare.
  scoreLine: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
  actions: { flexDirection: "row", alignItems: "center", gap: space[12] },
  learned: { flex: 1 },
});
