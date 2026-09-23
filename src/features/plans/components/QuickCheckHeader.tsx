import { StyleSheet, View } from "react-native";
import { X } from "lucide-react-native";

import { HeaderIconButton } from "@/ui/HeaderIconButton";
import { ScreenHeader } from "@/ui/ScreenHeader";
import { StepCounter } from "@/ui/StepCounter";
import { StepProgress } from "@/ui/StepProgress";

const QUICK_CHECK_STEPS = 3;

export type QuickCheckHeaderProps = {
  step: 1 | 2;
  onClose: () => void;
  testID: string;
};

/** Shared by every Quick Check screen: close + "Quick check" + "N of 2" + a step tracker. */
export function QuickCheckHeader({ step, onClose, testID }: QuickCheckHeaderProps) {
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
        right={<StepCounter label={`${step} of 2`} />}
      />
      <StepProgress
        testID={`${testID}-progress`}
        steps={QUICK_CHECK_STEPS}
        activeIndex={step - 1}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 16 },
});
