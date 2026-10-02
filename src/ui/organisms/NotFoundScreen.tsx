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
  /** The way out: "Back to Plans". */
  actionLabel: string;
  onAction: () => void;
  testID: string;
};

/**
 * What a screen shows when what it's for isn't there — a plan or day that
 * doesn't exist, or a link that doesn't make sense — instead of nothing: what
 * happened, and one way out.
 */
export function NotFoundScreen({
  title,
  message,
  actionLabel,
  onAction,
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
      <Button
        testID={`${testID}-action`}
        label={actionLabel}
        variant="secondary"
        onPress={onAction}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  centre: { flex: 1, justifyContent: "center", gap: space[12] },
  centred: { textAlign: "center" },
});
