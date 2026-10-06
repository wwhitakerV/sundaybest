import { StyleSheet, View } from "react-native";
import { Check } from "lucide-react-native";

import { space, useTheme } from "@/theme";
import { Spinner } from "@/ui/atoms/Spinner";
import { SFProBody } from "@/ui/typography/SFProBody";
import type { BuildStep } from "../logic/build-steps";

/** Each step's mark: a ring the size of a line of text and a little more. */
const MARK_SIZE = 28;
const MARK_BORDER = 2;
/** The line joining one step's mark to the next. */
const JOIN_HEIGHT = 18;
const CHECK_SIZE = 16;

export type BuildStepsProps = { steps: BuildStep[]; testID: string };

/**
 * A build's steps, top to bottom, joined by a line: a finished step's mark
 * filled with the accent and checked, the step under way spinning, and a
 * step still to come an empty ring.
 */
export function BuildSteps({ steps, testID }: BuildStepsProps) {
  const theme = useTheme();

  return (
    <View testID={testID}>
      {steps.map(({ key, label, state }, index) => (
        <View key={key}>
          {index > 0 && (
            <View
              style={[
                styles.join,
                {
                  backgroundColor:
                    state === "pending" ? theme.colors.sequenceLine : theme.colors.accent,
                },
              ]}
            />
          )}
          <View
            testID={`${testID}-${key}`}
            accessibilityState={{ busy: state === "active", checked: state === "done" }}
            style={styles.row}
          >
            {state === "active" ? (
              <Spinner testID={`${testID}-${key}-spinner`} size={MARK_SIZE} />
            ) : (
              <View
                testID={`${testID}-${key}-mark`}
                style={[
                  styles.mark,
                  state === "done"
                    ? { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent }
                    : { backgroundColor: "transparent", borderColor: theme.colors.sequenceLine },
                ]}
              >
                {state === "done" && (
                  <Check
                    size={CHECK_SIZE}
                    color={theme.colors.onAccent}
                    strokeWidth={theme.icon.strokeWidth}
                  />
                )}
              </View>
            )}
            <SFProBody variant="listItem" tone={state === "pending" ? "textMuted" : "text"}>
              {label}
            </SFProBody>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: space[16] },
  mark: {
    width: MARK_SIZE,
    height: MARK_SIZE,
    borderRadius: MARK_SIZE / 2,
    borderWidth: MARK_BORDER,
    alignItems: "center",
    justifyContent: "center",
  },
  // Centred under the mark above it.
  join: { width: MARK_BORDER, height: JOIN_HEIGHT, marginLeft: (MARK_SIZE - MARK_BORDER) / 2 },
});
