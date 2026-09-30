import { Fragment } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { LucideIcon } from "lucide-react-native";

import { useTheme } from "@/theme";

const ICON_SIZE = 14;
const ICON_GAP = 6;
const RULE_WIDTH = 1;
const RULE_HEIGHT = 14;
/** How far a label may shrink to keep the row on one line. */
const MIN_LABEL_SCALE = 0.75;

type Fact = { key: string; icon: LucideIcon; label: string };

export type FactRowProps = {
  /** Each fact: `{testID}-{key}` finds it. */
  facts: readonly Fact[];
  testID: string;
};

/**
 * A few facts about what's ahead — how many questions, how long — set
 * plainly in one row, each with its icon, parted by thin grey rules. Nothing
 * behind them, so they never read as buttons. Always one line: short of
 * room, the labels shrink rather than wrap.
 */
export function FactRow({ facts, testID }: FactRowProps) {
  const theme = useTheme();

  return (
    <View testID={testID} style={[styles.row, { gap: theme.spacing.md }]}>
      {facts.map(({ key, icon: Icon, label }, index) => (
        <Fragment key={key}>
          {index > 0 && (
            <View
              testID={`${testID}-rule-${index}`}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              style={[styles.rule, { backgroundColor: theme.colors.border }]}
            />
          )}
          <View testID={`${testID}-${key}`} style={styles.fact}>
            <Icon size={ICON_SIZE} color={theme.colors.text} strokeWidth={theme.icon.strokeWidth} />
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={MIN_LABEL_SCALE}
              style={[theme.typography.factLabel, styles.label, { color: theme.colors.text }]}
            >
              {label}
            </Text>
          </View>
        </Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "nowrap", alignItems: "center" },
  fact: { flexDirection: "row", alignItems: "center", gap: ICON_GAP, flexShrink: 1 },
  label: { flexShrink: 1 },
  rule: { width: RULE_WIDTH, height: RULE_HEIGHT },
});
