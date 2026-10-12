import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { Lock } from "lucide-react-native";

import { space, useTheme } from "@/theme";
import { Card } from "@/ui/atoms/Card";
import { MonoBody } from "@/ui/typography/MonoBody";
import { SerifTitle } from "@/ui/typography/SerifTitle";

const LOCK_SIZE = 16;

export type ReflectionCardProps = {
  question: string;
  /** The answer box, under the question. */
  children: ReactNode;
  testID?: string;
};

/**
 * A reflection question, room to answer under it, and a word that it's
 * private — on the page itself: no edge, and no padding at its sides, so it
 * lines up with the page's words and the answer box is the one thing outlined.
 */
export function ReflectionCard({ question, children, testID }: ReflectionCardProps) {
  const theme = useTheme();

  return (
    <Card testID={testID} fill="page" edge={false} inset={false} style={styles.card}>
      <SerifTitle variant="question">{question}</SerifTitle>
      {children}
      <View style={styles.privacy}>
        <Lock
          size={LOCK_SIZE}
          color={theme.colors.textMuted}
          strokeWidth={theme.icon.strokeWidth}
        />
        <MonoBody variant="supporting" tone="textMuted">
          Only you ever see this.
        </MonoBody>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { paddingVertical: space[22], paddingHorizontal: 0, gap: space[16] },
  privacy: { flexDirection: "row", alignItems: "center", gap: space[8] },
});
