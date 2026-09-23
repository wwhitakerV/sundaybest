import { StyleSheet, Text, View } from "react-native";
import { ArrowLeft, Type } from "lucide-react-native";

import { HeaderIconButton } from "@/ui/HeaderIconButton";
import { ScreenHeader } from "@/ui/ScreenHeader";
import { StepProgress } from "@/ui/StepProgress";
import { useTheme } from "@/theme";

const STUDY_STEPS = 4;
const TEXT_SIZE_ICON_SIZE = 20;
const STEP_LABEL_TOP_GAP = 8;
// Mirrors `StepProgress`'s own segment gap so each label's flex-1
// container lines up under its corresponding progress segment — read
// only, `StepProgress` itself is untouched.
const STEP_PROGRESS_SEGMENT_GAP = 4;

const STEP_LABELS = ["Read", "Scripture", "Reflect", "Pray"] as const;
// Read anchors to the left edge of its segment, Pray to the right edge of
// its own; Scripture and Reflect stay left/right respectively so the row
// spreads inward from both ends rather than every label using the same
// alignment.
const STEP_LABEL_ALIGN = ["left", "left", "right", "right"] as const;

export type StudyHeaderProps = {
  day: number;
  totalDays: number;
  onBack: () => void;
  onTextSize: () => void;
  /** 0-indexed position in Read/Scripture/Reflect/Pray. Omit to hide the tracker. */
  step?: number;
  testID: string;
};

/**
 * Shared by Read, Scripture, Reflect, and Pray — every screen in the daily
 * study flow has an identical back + "Day X of Y" + text-size header, plus
 * the 4-segment step tracker beneath it. Local to this slice rather than
 * `src/ui`: the day/step content is specific to the plan/day study
 * experience, though it's built from `src/ui`'s generic header/progress
 * primitives.
 */
export function StudyHeader({
  day,
  totalDays,
  onBack,
  onTextSize,
  step,
  testID,
}: StudyHeaderProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <ScreenHeader
        testID={testID}
        title={`Day ${day} of ${totalDays}`}
        left={
          <HeaderIconButton
            testID={`${testID}-back-button`}
            icon={ArrowLeft}
            accessibilityLabel="Back"
            onPress={onBack}
          />
        }
        right={
          <HeaderIconButton
            testID={`${testID}-text-size-button`}
            icon={Type}
            size={TEXT_SIZE_ICON_SIZE}
            accessibilityLabel="Text size"
            onPress={onTextSize}
          />
        }
      />
      {step !== undefined && (
        <View>
          <StepProgress testID={`${testID}-progress`} steps={STUDY_STEPS} activeIndex={step} />
          <View style={styles.labelRow}>
            {STEP_LABELS.map((label, index) => (
              <Text
                key={label}
                testID={`${testID}-progress-label-${index}`}
                numberOfLines={1}
                style={[
                  theme.typography.stepLabel,
                  styles.label,
                  {
                    textAlign: STEP_LABEL_ALIGN[index],
                    color:
                      index === step
                        ? theme.colors.stepLabelActive
                        : theme.colors.stepLabelInactive,
                  },
                ]}
              >
                {label}
              </Text>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 16 },
  labelRow: {
    flexDirection: "row",
    gap: STEP_PROGRESS_SEGMENT_GAP,
    marginTop: STEP_LABEL_TOP_GAP,
  },
  label: { flex: 1 },
});
