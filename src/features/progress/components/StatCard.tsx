import { StyleSheet } from "react-native";

import { space } from "@/theme";
import { Card } from "@/ui/atoms/Card";
import { DisplayTitle } from "@/ui/typography/DisplayTitle";
import { SFProBody } from "@/ui/typography/SFProBody";

export type StatCardProps = {
  value: string;
  label: string;
  testID: string;
};

/** One total on Progress: the number, large, over what it counts. */
export function StatCard({ value, label, testID }: StatCardProps) {
  return (
    <Card testID={testID} style={styles.card}>
      <DisplayTitle>{value}</DisplayTitle>
      <SFProBody tone="textMuted" numberOfLines={1}>
        {label}
      </SFProBody>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, padding: space[18], gap: space[6] },
});
