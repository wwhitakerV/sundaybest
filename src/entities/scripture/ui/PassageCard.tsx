import type { ReactNode } from "react";
import { StyleSheet } from "react-native";

import { radius, space } from "@/theme";
import { Card } from "@/ui/atoms/Card";
import { SerifBody } from "@/ui/typography/SerifBody";

/** Its corners. */
export const PASSAGE_CARD_RADIUS = radius[24];

export type PassageCardProps = {
  /** The verses, as runs of text (their numbers in `MonoLabel variant="emphasis"`). */
  children: ReactNode;
  testID?: string;
};

/** A passage of scripture on its card, in the serif reading face. */
export function PassageCard({ children, testID }: PassageCardProps) {
  return (
    <Card
      testID={testID && `${testID}-card`}
      radius={PASSAGE_CARD_RADIUS}
      fill="page"
      style={styles.card}
    >
      <SerifBody testID={testID}>{children}</SerifBody>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { paddingHorizontal: space[22], paddingVertical: space[18] },
});
