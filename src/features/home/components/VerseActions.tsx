import { StyleSheet, View } from "react-native";
import { Heart, Share } from "lucide-react-native";

import { space, useTheme } from "@/theme";
import { RoundIconButton } from "@/ui/atoms/RoundIconButton";

export type VerseActionsProps = {
  liked: boolean;
  onLike: () => void;
  onShare: () => void;
  testID: string;
};

/** Under the verse of the day, centred: a heart to like it (filled red once it is), and Share. */
export function VerseActions({ liked, onLike, onShare, testID }: VerseActionsProps) {
  const theme = useTheme();
  return (
    <View testID={testID} style={styles.actions}>
      <RoundIconButton
        testID={`${testID}-like`}
        icon={Heart}
        accessibilityLabel="Like"
        on={liked}
        onColor={theme.colors.accent}
        onPress={onLike}
      />
      <RoundIconButton
        testID={`${testID}-share`}
        icon={Share}
        accessibilityLabel="Share"
        onPress={onShare}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: "row", justifyContent: "center", gap: space[16] },
});
