import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { StudyEnter } from "./StudyEnter";
import { space } from "@/theme";

export type StudyFollowProps = {
  children: ReactNode;
};

/**
 * Everything on a Daily Study page below its kicker and title — the reading,
 * the verses, the question, the prayer — which comes in a beat after them.
 */
export function StudyFollow({ children }: StudyFollowProps) {
  return (
    <StudyEnter order={2}>
      <View style={styles.follow}>{children}</View>
    </StudyEnter>
  );
}

const styles = StyleSheet.create({
  follow: { gap: space[16] },
});
