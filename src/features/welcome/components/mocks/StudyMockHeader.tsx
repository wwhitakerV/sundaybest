import { StyleSheet, Text, View } from "react-native";
import { ALargeSmall, X } from "lucide-react-native";

import { HeaderIconButton } from "@/ui/HeaderIconButton";
import { ScreenHeader } from "@/ui/ScreenHeader";
import { StepProgress } from "@/ui/StepProgress";
import { useTheme } from "@/theme";

const STEP_LABELS = ["Read", "Scripture", "Reflect", "Pray"] as const;
// Matches the real `StudyHeader`: text size left (20pt icon), close right.
const TEXT_SIZE_ICON_SIZE = 20;

export type StudyMockHeaderProps = {
  /** 0-indexed: Read, Scripture, Reflect, Pray. */
  activeStep: number;
  /** Prefix for the (inert) header buttons' testIDs. */
  testID: string;
};

/**
 * The Daily Study header as the mocks draw it — nav, step tracker, labels —
 * like the real `StudyHeader`: it stays put while the body steps beneath it.
 */
export function StudyMockHeader({ activeStep, testID }: StudyMockHeaderProps) {
  const theme = useTheme();
  const noop = () => undefined;

  return (
    <>
      <ScreenHeader
        title="Day 2 of 6"
        left={
          <HeaderIconButton
            testID={`${testID}-text-size`}
            icon={ALargeSmall}
            size={TEXT_SIZE_ICON_SIZE}
            accessibilityLabel="Text size"
            onPress={noop}
          />
        }
        right={
          <HeaderIconButton
            testID={`${testID}-close`}
            icon={X}
            accessibilityLabel="Close"
            onPress={noop}
          />
        }
      />

      <View style={styles.steps}>
        <StepProgress steps={STEP_LABELS.length} activeIndex={activeStep} />
        <View style={styles.stepLabels}>
          {STEP_LABELS.map((label, index) => (
            <Text
              key={label}
              style={[
                theme.typography.stepLabel,
                {
                  color:
                    index === activeStep
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
    </>
  );
}

const styles = StyleSheet.create({
  steps: { gap: 10, marginTop: 4 },
  stepLabels: { flexDirection: "row", justifyContent: "space-between" },
});

export type StudyKickerProps = { label: string };

/** A study step's mono kicker, e.g. "Day 2  Scripture" — part of the step's body. */
export function StudyKicker({ label }: StudyKickerProps) {
  const theme = useTheme();

  return (
    <Text style={[theme.typography.metaLabel, { color: theme.colors.text }]}>
      {"Day 2  "}
      <Text style={{ color: theme.colors.textMuted }}>{label}</Text>
    </Text>
  );
}
