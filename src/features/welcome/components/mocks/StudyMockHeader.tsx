import { StyleSheet, View } from "react-native";
import { ALargeSmall, X } from "lucide-react-native";

import { HeaderIconButton } from "@/ui/atoms/HeaderIconButton";
import { ScreenHeader } from "@/ui/molecules/ScreenHeader";
import { StepProgress } from "@/ui/atoms/StepProgress";
import { space } from "@/theme";
import { MonoLabel } from "@/ui/typography/MonoLabel";
import { SFProLabel } from "@/ui/typography/SFProLabel";
import { Span } from "@/ui/typography/Span";

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
            <SFProLabel
              variant="stepLabel"
              tone={index === activeStep ? "stepLabelActive" : "stepLabelInactive"}
              key={label}
            >
              {label}
            </SFProLabel>
          ))}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  steps: { gap: space[10], marginTop: space[4] },
  stepLabels: { flexDirection: "row", justifyContent: "space-between" },
});

export type StudyKickerProps = { label: string };

/** A study step's mono kicker, e.g. "Day 2  Scripture" — part of the step's body. */
export function StudyKicker({ label }: StudyKickerProps) {
  return (
    <MonoLabel>
      {"Day 2  "}
      <Span tone="textMuted">{label}</Span>
    </MonoLabel>
  );
}
