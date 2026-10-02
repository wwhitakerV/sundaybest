import { Pressable, StyleSheet } from "react-native";
import { ChevronRight } from "lucide-react-native";

import { controlHeight, space, useTheme } from "@/theme";
import { SFProLabel } from "@/ui/typography/SFProLabel";

const CHEVRON = 16;
/** Up to a 44pt target, without the words looking any bigger. */
const HIT_SLOP = (controlHeight.hitTarget - CHEVRON) / 2;

export type PlanCardActionProps = {
  /** "Continue" for a plan under way, "Start" for one not started. */
  label: string;
  /** The plan it acts on, for a screen reader: "<label> <title>". */
  title: string;
  onPress: () => void;
  testID: string;
};

/** "Continue ›" or "Start ›": a plan card's way straight into its study. */
export function PlanCardAction({ label, title, onPress, testID }: PlanCardActionProps) {
  const theme = useTheme();

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={`${label} ${title}`}
      hitSlop={HIT_SLOP}
      onPress={onPress}
      style={[styles.link, { gap: space[2] }]}
    >
      <SFProLabel>{label}</SFProLabel>
      <ChevronRight size={CHEVRON} color={theme.colors.text} strokeWidth={theme.icon.strokeWidth} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  link: { flexDirection: "row", alignItems: "center" },
});
