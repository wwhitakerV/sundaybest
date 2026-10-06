import { StyleSheet, View } from "react-native";
import { Check } from "lucide-react-native";

import { space, useTheme } from "@/theme";
import { Spinner } from "@/ui/atoms/Spinner";
import { SFProBody } from "@/ui/typography/SFProBody";
import type { BuildStep } from "../logic/build-steps";

/** Each step's mark: a ring the size of a line of text and a little more. */
const MARK_SIZE = 28;
const MARK_BORDER = 2;
const CHECK_SIZE = 16;
/** Between a step's mark and its words. */
const MARK_GAP = space[22];
/** A step not yet started steps well back, so the eye stays on the one under way. */
const PENDING_OPACITY = 0.35;
/** A step's room above and below its words: spacious, one step to a glance. */
const ROW_PADDING = space[18];

export type BuildStepsProps = { steps: BuildStep[]; testID: string };

/**
 * A build's steps, top to bottom, parted by room alone: each with its mark,
 * its name, and what it does — or, once done, what it did. A finished step's
 * mark is filled and checked, the step under way spins, and a step still to
 * come is an empty ring.
 */
export function BuildSteps({ steps, testID }: BuildStepsProps) {
  return (
    <View testID={testID}>
      {steps.map((step) => (
        <View key={step.key}>
          <StepRow step={step} testID={`${testID}-${step.key}`} />
        </View>
      ))}
    </View>
  );
}

function StepRow({ step: { label, detail, state }, testID }: { step: BuildStep; testID: string }) {
  const active = state === "active";

  return (
    <View
      testID={testID}
      accessibilityState={{ busy: active, checked: state === "done" }}
      style={styles.row}
    >
      {active ? (
        <Spinner testID={`${testID}-spinner`} size={MARK_SIZE} />
      ) : (
        <StepMark done={state === "done"} testID={`${testID}-mark`} />
      )}
      <View
        testID={`${testID}-words`}
        style={[styles.words, state === "pending" && styles.pending]}
      >
        <SFProBody variant="listItem" tone="text">
          {label}
        </SFProBody>
        <SFProBody variant="detail" tone="textMuted">
          {detail}
        </SFProBody>
      </View>
    </View>
  );
}

function StepMark({ done, testID }: { done: boolean; testID: string }) {
  const theme = useTheme();

  return (
    <View
      testID={testID}
      style={[
        styles.mark,
        done
          ? { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent }
          : { backgroundColor: "transparent", borderColor: theme.colors.sequenceLine },
      ]}
    >
      {done && (
        <Check
          size={CHECK_SIZE}
          color={theme.colors.onAccent}
          strokeWidth={theme.icon.strokeWidth}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: MARK_GAP,
    paddingVertical: ROW_PADDING,
  },
  mark: {
    width: MARK_SIZE,
    height: MARK_SIZE,
    borderRadius: MARK_SIZE / 2,
    borderWidth: MARK_BORDER,
    alignItems: "center",
    justifyContent: "center",
  },
  words: { flex: 1, gap: space[4] },
  pending: { opacity: PENDING_OPACITY },
});
