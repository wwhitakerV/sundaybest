import { StyleSheet, View } from "react-native";

import { space } from "@/theme";
import { MonoBody } from "@/ui/typography/MonoBody";
import { SFProTitle } from "@/ui/typography/SFProTitle";

export type QuickCheckIntroProps = {
  title: string;
  questionCount: number;
};

/** A Quick Check not started yet: what it is and how long, before Start. */
export function QuickCheckIntro({ title, questionCount }: QuickCheckIntroProps) {
  return (
    <View testID="quick-check-intro" style={styles.body}>
      <MonoBody tone="textMuted">
        {`${questionCount} ${questionCount === 1 ? "question" : "questions"}`}
      </MonoBody>
      <SFProTitle>{title}</SFProTitle>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { gap: space[16] },
});
