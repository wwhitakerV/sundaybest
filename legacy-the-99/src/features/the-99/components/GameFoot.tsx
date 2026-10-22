import { StyleSheet, View } from "react-native";
import { Share2 } from "lucide-react-native";

import { controlHeight, space } from "@/theme";
import { Button } from "@/ui/atoms/Button";
import { SFProBody } from "@/ui/typography/SFProBody";

export type GameFootProps = {
  /** What to do now — or `null` once it's over, when Share and Done take its place. */
  hint: string | null;
  onShare: () => void;
  onDone: () => void;
};

/**
 * Under the board, always one button tall so the board never moves: while
 * playing, what to do; once over, Share beside Done.
 */
export function GameFoot({ hint, onShare, onDone }: GameFootProps) {
  if (hint !== null) {
    return (
      <View style={[styles.foot, styles.hint]}>
        <SFProBody variant="rowDetail" tone="textSupporting" style={styles.centred}>
          {hint}
        </SFProBody>
      </View>
    );
  }
  return (
    <View style={[styles.foot, styles.actions]}>
      <View style={styles.action}>
        <Button
          testID="the-99-share"
          label="Share"
          icon={Share2}
          variant="soft"
          onPress={onShare}
        />
      </View>
      <View style={styles.action}>
        <Button testID="the-99-done" label="Done" onPress={onDone} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  foot: { minHeight: controlHeight.button },
  hint: { justifyContent: "center", paddingHorizontal: space[16] },
  centred: { textAlign: "center" },
  actions: { flexDirection: "row", gap: space[12] },
  action: { flex: 1 },
});
