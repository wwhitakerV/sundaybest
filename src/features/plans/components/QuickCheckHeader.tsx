import { StyleSheet, Text, View } from "react-native";
import { X } from "lucide-react-native";

import { useTheme } from "@/theme";
import { HeaderIconButton } from "@/ui/HeaderIconButton";
import { ScreenHeader } from "@/ui/ScreenHeader";
import { StepProgress } from "@/ui/StepProgress";

const QUICK_CHECK_STEPS = 3;

export type QuickCheckHeaderProps = {
  step: 1 | 2;
  onClose: () => void;
  testID: string;
};

/** Shared by every Quick Check screen: close + "Quick check" + "N of 2" + a step tracker. */
export function QuickCheckHeader({ step, onClose, testID }: QuickCheckHeaderProps) {
  const theme = useTheme();

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
        right={
          <Text style={[theme.typography.stepCounter, { color: theme.colors.chromeStepCounter }]}>
            {step} of 2
          </Text>
        }
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
