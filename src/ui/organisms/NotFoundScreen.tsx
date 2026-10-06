import { StyleSheet, View } from "react-native";

import { space } from "@/theme";
import { Button } from "@/ui/atoms/Button";
import { SFProBody } from "@/ui/typography/SFProBody";
import { SFProTitle } from "@/ui/typography/SFProTitle";
import { Screen } from "./Screen";

export type NotFoundScreenProps = {
  /** "This plan isn't here". */
  title: string;
  /** Why, kindly, and what to do. */
  message: string;
  /** The main action: the way out ("Back to Plans"), or "Try again" when there's also a way out. */
  actionLabel: string;
  onAction: () => void;
  /** A second way out beside a retry ("Close"), so trying again is never the only choice. */
  secondary?: { label: string; onPress: () => void };
  testID: string;
};

/**
 * What a screen shows when what it's for isn't there, or couldn't be reached
 * — instead of nothing: what happened, and a way out. A screen that can be
 * retried offers the retry and a way out together, so the reader is never
 * held on it.
 */
export function NotFoundScreen({
  title,
  message,
  actionLabel,
  onAction,
  secondary,
  testID,
}: NotFoundScreenProps) {
  return (
    <Screen testID={testID} padded>
      <View style={styles.centre}>
        <SFProTitle accessibilityRole="header" style={styles.centred}>
          {title}
        </SFProTitle>
        <SFProBody tone="textMuted" style={styles.centred}>
          {message}
        </SFProBody>
      </View>
      <View style={styles.actions}>
        <Button
          testID={`${testID}-action`}
          label={actionLabel}
          variant={secondary ? "primary" : "secondary"}
          onPress={onAction}
        />
        {secondary && (
          <Button
            testID={`${testID}-secondary`}
            label={secondary.label}
            variant="secondary"
            onPress={secondary.onPress}
          />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  centre: { flex: 1, justifyContent: "center", gap: space[12] },
  centred: { textAlign: "center" },
  actions: { gap: space[8] },
});
