import { StyleSheet, View } from "react-native";
import { X } from "lucide-react-native";

import { HeaderIconButton } from "@/ui/atoms/HeaderIconButton";
import { ScreenHeader } from "@/ui/molecules/ScreenHeader";
import { StepCounter } from "@/ui/atoms/StepCounter";
import { StepProgress } from "@/ui/atoms/StepProgress";
import { space } from "@/theme";

export type QuickCheckHeaderProps = {
  /** How many questions the quiz has: one tracker segment each. */
  total: number;
  /** The question on screen: its "N of total", and its segment lit. */
  progress: { counter: number; index: number };
  onClose: () => void;
  testID: string;
};

/**
 * Quick Check's header: close + "Quick check" + "N of total" + a tracker
 * with a segment per question — the questions only, nothing else.
 */
export function QuickCheckHeader({ total, progress, onClose, testID }: QuickCheckHeaderProps) {
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
        right={<StepCounter label={`${progress.counter} of ${total}`} />}
      />
      <StepProgress testID={`${testID}-progress`} steps={total} activeIndex={progress.index} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: space[16] },
});
