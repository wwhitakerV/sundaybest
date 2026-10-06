import { Pressable, StyleSheet, View } from "react-native";
import { ChevronUp, X } from "lucide-react-native";

import { radius, space, useTheme } from "@/theme";
import { CompactButton } from "@/ui/atoms/CompactButton";
import type { GenerationBarView } from "../logic/generation-bar";
import { GenerationBarContent } from "./GenerationBarContent";

/** The X's place: the pill's rounded start, square to its height. */
const DISMISS_WIDTH = 52;
const ICON_SIZE = 18;

export type GenerationBarProps = {
  view: GenerationBarView;
  onDismiss: () => void;
  /** Opens the plan once it's ready. */
  onOpen: () => void;
  /** Shows the build's steps. */
  onExpand: () => void;
  onRetry: () => void;
  onChooseAnother: () => void;
  testID: string;
};

/**
 * The plan being built, floating above the tabs as a pill: an X in its
 * rounded start, always there to dismiss it, then a divider, then what's
 * happening. Building, it's the primary control's colours with a progress
 * line, and opens the build's steps; ready, it's green and opens the plan;
 * failed, it says why and offers what can be done.
 */
export function GenerationBar({
  view,
  onDismiss,
  onOpen,
  onExpand,
  onRetry,
  onChooseAnother,
  testID,
}: GenerationBarProps) {
  const theme = useTheme();
  const ready = view.kind === "ready";
  const fill = ready ? theme.colors.success : theme.colors.controlPrimary;
  const ink = ready ? theme.colors.onSuccess : theme.colors.onControlPrimary;
  const line = ready ? theme.colors.onSuccessFaint : theme.colors.onControlPrimaryFaint;
  // A button stands out against the bar: light on a dark bar, dark on a light one.
  const buttonTone = ready || theme.name === "dark" ? "dark" : "light";

  return (
    <View testID={testID} style={[styles.pill, { backgroundColor: fill }]}>
      <Pressable
        testID={`${testID}-dismiss`}
        accessibilityRole="button"
        accessibilityLabel="Dismiss"
        onPress={onDismiss}
        style={styles.dismiss}
      >
        <X size={ICON_SIZE} color={ink} strokeWidth={theme.icon.strokeWidth} />
      </Pressable>
      <View testID={`${testID}-divider`} style={[styles.divider, { backgroundColor: line }]} />
      <Pressable
        testID={`${testID}-details`}
        accessibilityRole="button"
        onPress={ready ? onOpen : onExpand}
        style={styles.details}
      >
        <View style={styles.content}>
          <GenerationBarContent view={view} testID={testID} />
        </View>
        {view.kind === "building" && (
          <ChevronUp size={ICON_SIZE} color={ink} strokeWidth={theme.icon.strokeWidth} />
        )}
      </Pressable>
      {view.kind !== "building" && (
        <View style={styles.action}>
          {ready ? (
            <CompactButton
              testID={`${testID}-open`}
              label="Open"
              tone={buttonTone}
              onPress={onOpen}
            />
          ) : view.action === "retry" ? (
            <CompactButton
              testID={`${testID}-retry`}
              label="Retry"
              tone={buttonTone}
              onPress={onRetry}
            />
          ) : (
            <CompactButton
              testID={`${testID}-choose-another`}
              label="New sermon"
              tone={buttonTone}
              onPress={onChooseAnother}
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "stretch",
    borderRadius: radius.pill,
    overflow: "hidden",
  },
  dismiss: { width: DISMISS_WIDTH, alignItems: "center", justifyContent: "center" },
  divider: { width: 1 },
  details: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: space[12],
    paddingLeft: space[16],
    paddingRight: space[20],
  },
  content: { flex: 1 },
  action: { justifyContent: "center", paddingRight: space[10] },
});
