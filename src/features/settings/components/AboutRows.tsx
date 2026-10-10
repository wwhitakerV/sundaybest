import { Fragment, type ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { ChevronRight, type LucideIcon } from "lucide-react-native";

import { space, useTheme } from "@/theme";
import { Card } from "@/ui/atoms/Card";
import { Divider } from "@/ui/atoms/Divider";
import { SFProBody } from "@/ui/typography/SFProBody";

const ICON_SIZE = 20;
/** The icon's box: as tall as a row's name, so the icon sits level with it. */
const ICON_BOX = { width: 24, height: 22 } as const;
const CHEVRON = 18;
/** A row's least height: a comfortable tap, as Settings' rows are. */
const MIN_ROW_HEIGHT = 56;

/** One row: what it's called, what it means, or both — and where it goes, if it goes anywhere. */
export type AboutRow = {
  key: string;
  title?: string;
  text?: string;
  icon?: LucideIcon;
  onPress?: () => void;
};

/**
 * An About page's list, as Settings sets its own: rows on one soft card with
 * hairlines between — each a quiet icon, its name in the regular weight, what
 * it means in grey beneath with room to read, and a chevron where it goes
 * somewhere. A row with no name says its words in full ink. The card is
 * outlined only when a row goes somewhere: one that's only read is its fill alone.
 */
export function AboutRows({ rows, testID }: { rows: readonly AboutRow[]; testID: string }) {
  return (
    <Card testID={testID} radius={24} edge={rows.some((row) => row.onPress)} style={styles.card}>
      {rows.map((row, index) => (
        <Fragment key={row.key}>
          {index > 0 && <Divider />}
          <AboutRowView row={row} />
        </Fragment>
      ))}
    </Card>
  );
}

function AboutRowView({ row }: { row: AboutRow }) {
  const theme = useTheme();
  const Icon = row.icon;
  const layout = [
    styles.row,
    {
      gap: space[14],
      paddingHorizontal: space[16],
      // A row with a description gets a little more room, so its lines don't crowd the hairlines.
      paddingVertical: row.title && row.text ? space[16] : space[14],
      alignItems: row.title && row.text ? ("flex-start" as const) : ("center" as const),
    },
  ];
  const content: ReactNode = (
    <>
      {Icon && (
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={styles.icon}
        >
          <Icon size={ICON_SIZE} color={theme.colors.text} strokeWidth={theme.icon.strokeWidth} />
        </View>
      )}
      <View style={[styles.copy, { gap: space[4] }]}>
        {row.title && <SFProBody>{row.title}</SFProBody>}
        {row.text &&
          (row.title ? (
            <SFProBody variant="rowDetail" tone="textSupporting">
              {row.text}
            </SFProBody>
          ) : (
            <SFProBody>{row.text}</SFProBody>
          ))}
      </View>
      {row.onPress && (
        <ChevronRight
          size={CHEVRON}
          color={theme.colors.textMuted}
          strokeWidth={theme.icon.strokeWidth}
          style={styles.chevron}
        />
      )}
    </>
  );

  if (!row.onPress) return <View style={layout}>{content}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={row.title ?? row.text}
      onPress={row.onPress}
      style={[layout]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { overflow: "hidden" },
  row: { minHeight: MIN_ROW_HEIGHT, flexDirection: "row" },
  icon: { ...ICON_BOX, alignItems: "center", justifyContent: "center" },
  copy: { flex: 1 },
  chevron: { alignSelf: "center" },
});
