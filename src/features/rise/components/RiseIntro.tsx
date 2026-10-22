import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Play } from "lucide-react-native";

import { space, useTheme } from "@/theme";
import { Button } from "@/ui/atoms/Button";
import { PAGE_INSET } from "@/ui/organisms/Screen";
import { SerifTitle } from "@/ui/typography/SerifTitle";
import { SFProBody } from "@/ui/typography/SFProBody";

export type RiseIntroProps = {
  /** The first time ever: a practice pair comes first. */
  practice: boolean;
  onStart: () => void;
};

/** Before the first pair rises: the twist, said plainly — cross out the wrong one — and Start. */
export function RiseIntro({ practice, onStart }: RiseIntroProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.foot,
        { backgroundColor: colors.background, paddingBottom: insets.bottom + space[16] },
      ]}
    >
      <View style={styles.words}>
        <SerifTitle variant="feature" accessibilityRole="header">
          Cross out the wrong one.
        </SerifTitle>
        <SFProBody variant="rowDetail" tone="textSupporting">
          {practice
            ? "Paint across the wrong answer before its balloon reaches the line. Be quick: the seconds you don't use are yours to spare. First, one for practice."
            : "Six questions. Paint across the wrong answer before its balloon reaches the line. Be quick: the seconds you don't use are yours to spare."}
        </SFProBody>
      </View>
      <Button testID="rise-start" label="Start" icon={Play} onPress={onStart} />
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
    paddingTop: space[16],
    gap: space[20],
  },
  words: { gap: space[8] },
});
