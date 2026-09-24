import { StyleSheet, View } from "react-native";
import { X } from "lucide-react-native";

import { HeaderIconButton } from "@/ui/HeaderIconButton";
import { ScreenHeader } from "@/ui/ScreenHeader";
import { StepCounter } from "@/ui/StepCounter";
import { StepProgress } from "@/ui/StepProgress";

export type QuickCheckHeaderProps = {
  /** The question on screen, shown as "N of total". */
  counter: number;
  /** How many questions the quiz has. */
  total: number;
  /** The active segment of the tracker: one per question, then the score. */
  progressIndex: number;
  onClose: () => void;
  testID: string;
};

/**
 * Quick Check's header: close + "Quick check" + "N of total" + a tracker
 * with a segment per question and a last one for the score.
 */
export function QuickCheckHeader({
  counter,
  total,
  progressIndex,
  onClose,
  testID,
}: QuickCheckHeaderProps) {
  return (
    <View style={styles.container}>
      <ScreenHeader
        testID={testID}
        title="Quick check"
        left={
          <HeaderIconButton
            testID={`${testID}-close-button`}
            icon={X}
            accessibilityLabel="Close"
            onPress={onClose}
          />
        }
        right={<StepCounter label={`${counter} of ${total}`} />}
      />
      <StepProgress testID={`${testID}-progress`} steps={total + 1} activeIndex={progressIndex} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 16 },
});
