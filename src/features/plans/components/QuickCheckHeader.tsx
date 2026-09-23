import { StyleSheet, View } from "react-native";
import { X } from "lucide-react-native";

import { HeaderIconButton } from "@/ui/HeaderIconButton";
import { ScreenHeader } from "@/ui/ScreenHeader";
import { StepCounter } from "@/ui/StepCounter";
import { StepProgress } from "@/ui/StepProgress";

const QUICK_CHECK_STEPS = 3;

export type QuickCheckHeaderProps = {
  /** The question number shown as "N of 2". */
  counter: 1 | 2;
  /** The active segment of the 3-segment tracker (the last is the score). */
  progressIndex: number;
  onClose: () => void;
  testID: string;
};

/** Quick Check's fixed header: close + "Quick check" + "N of 2" + a step tracker. */
export function QuickCheckHeader({
  counter,
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
        right={<StepCounter label={`${counter} of 2`} />}
      />
      <StepProgress
        testID={`${testID}-progress`}
        steps={QUICK_CHECK_STEPS}
        activeIndex={progressIndex}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 16 },
});
