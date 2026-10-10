import { StyleSheet, View } from "react-native";

import { space, useTheme } from "@/theme";
import { Card } from "@/ui/atoms/Card";
import { MonoLabel } from "@/ui/typography/MonoLabel";
import { SFProTitle } from "@/ui/typography/SFProTitle";
import { tallyQuizReview, type QuizReviewItem } from "../logic/quick-check-review";
import { QuickCheckReviewCard } from "./QuickCheckReviewCard";

export type QuickCheckResultsProps = {
  items: readonly QuizReviewItem[];
  testID: string;
};

/**
 * A finished Quick Check, under its score: how many were right and how
 * many missed, then every question reviewed on a card of its own — what was
 * asked, what was answered, the right answer where it was missed, and why.
 */
export function QuickCheckResults({ items, testID }: QuickCheckResultsProps) {
  const { right, missed } = tallyQuizReview(items);

  return (
    <View testID={testID} style={styles.results}>
      <Card edge={false} radius={24} style={styles.tally}>
        <Tally count={right} label="Right" tone="correct" testID={`${testID}-right-count`} />
        <TallyDivider />
        <Tally count={missed} label="Missed" tone="incorrect" testID={`${testID}-missed-count`} />
      </Card>

      <MonoLabel variant="labelTracked" tone="textMuted" style={styles.label}>
        Your answers
      </MonoLabel>
      {items.map((item) => (
        <QuickCheckReviewCard key={item.id} item={item} testID={`${testID}-question-${item.id}`} />
      ))}
    </View>
  );
}

/** One side of the tally: a count in SF, its word under it. */
function Tally({
  count,
  label,
  tone,
  testID,
}: {
  count: number;
  label: string;
  tone: "correct" | "incorrect";
  testID: string;
}) {
  return (
    <View style={styles.side}>
      {/* A number, so the system face — the same size and weight the serif had. */}
      <SFProTitle variant="message" tone={tone} testID={testID}>
        {String(count)}
      </SFProTitle>
      <MonoLabel variant="labelTracked" tone="textMuted" style={styles.label}>
        {label}
      </MonoLabel>
    </View>
  );
}

function TallyDivider() {
  const theme = useTheme();
  return <View style={[styles.divider, { backgroundColor: theme.colors.divider }]} />;
}

const styles = StyleSheet.create({
  results: { gap: space[16] },
  tally: { flexDirection: "row", alignItems: "center", paddingVertical: space[20] },
  side: { flex: 1, alignItems: "center", gap: space[4] },
  divider: { width: 1, alignSelf: "stretch" },
  label: { textTransform: "uppercase", marginTop: space[8] },
});
