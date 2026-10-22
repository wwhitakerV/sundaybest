import { StyleSheet, View } from "react-native";

import { space } from "@/theme";
import { SerifTitle } from "@/ui/typography/SerifTitle";
import { SFProBody } from "@/ui/typography/SFProBody";

export type GameResultProps = {
  result: { headline: string; compared: string | null };
};

/**
 * How the run went, set over the stilled board: how many were saved and lost
 * — or every one — like a headline; how it compares with yesterday, and
 * that there's a new flock tomorrow, quietly.
 */
export function GameResult({ result }: GameResultProps) {
  return (
    <View testID="the-99-result" style={styles.words}>
      <SerifTitle variant="feature" style={styles.centred} accessibilityRole="header">
        {result.headline}
      </SerifTitle>
      <SFProBody variant="rowDetail" tone="textSupporting" style={styles.centred}>
        {[result.compared, "A new flock tomorrow."].filter(Boolean).join(" ")}
      </SFProBody>
    </View>
  );
}

const styles = StyleSheet.create({
  words: { gap: space[8], alignItems: "center", paddingHorizontal: space[24] },
  centred: { textAlign: "center" },
});
