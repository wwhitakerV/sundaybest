import { Fragment } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { ChevronRight } from "lucide-react-native";

import { space, useTheme } from "@/theme";
import { Card } from "@/ui/atoms/Card";
import { Divider } from "@/ui/atoms/Divider";
import { SFProBody } from "@/ui/typography/SFProBody";

/** Settings' chevron size, as its rows end. */
const CHEVRON = 18;

export type ReflectionsPlanCardProps = {
  /** The plan's title, over its card, as Weeks names its months. */
  title: string;
  rows: readonly { id: string; question: string; date: string }[];
  onOpen: (reflectionId: string) => void;
};

/**
 * One plan's reflections: its name in the quiet label Weeks names its months
 * with, then Settings' group card — each row the question, its date under it,
 * and the chevron; a row opens Your words on it.
 */
export function ReflectionsPlanCard({ title, rows, onOpen }: ReflectionsPlanCardProps) {
  const theme = useTheme();

  return (
    <View style={{ gap: space[8] }}>
      <SFProBody
        variant="label"
        tone="textSupporting"
        accessibilityRole="header"
        style={styles.title}
      >
        {title}
      </SFProBody>
      <Card radius={24} style={styles.card}>
        {rows.map((row, index) => (
          <Fragment key={row.id}>
            {index > 0 && <Divider />}
            <Pressable
              testID={`reflections-row-${row.id}`}
              accessibilityRole="button"
              accessibilityLabel={`${row.question}, ${row.date}`}
              onPress={() => onOpen(row.id)}
              style={[
                styles.row,
                { gap: space[16], paddingHorizontal: space[16], paddingVertical: space[14] },
              ]}
            >
              <View style={[styles.copy, { gap: space[2] }]}>
                <SFProBody numberOfLines={2}>{row.question}</SFProBody>
                <SFProBody variant="rowDetail" tone="textSupporting">
                  {row.date}
                </SFProBody>
              </View>
              <ChevronRight
                size={CHEVRON}
                color={theme.colors.textSupporting}
                strokeWidth={theme.icon.strokeWidthStrong}
              />
            </Pressable>
          </Fragment>
        ))}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  // As Weeks' month names sit: a little in from the card's edge.
  title: { paddingTop: space[12], paddingHorizontal: space[4] },
  card: { overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center" },
  copy: { flex: 1 },
});
