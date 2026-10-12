import { Fragment } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import {
  Bell,
  BookOpen,
  ChevronRight,
  Flag,
  Mail,
  ShieldCheck,
  Sparkles,
  Type,
  UserStar,
  type LucideIcon,
} from "lucide-react-native";

import { Card } from "@/ui/atoms/Card";
import { Divider } from "@/ui/atoms/Divider";
import { controlHeight, iconSize, space, useTheme } from "@/theme";
import type { SettingsIcon, SettingsRow } from "../logic/settings-sections";
import { SFProBody } from "@/ui/typography/SFProBody";

const ICONS: Record<SettingsIcon, LucideIcon> = {
  bell: Bell,
  book: BookOpen,
  type: Type,
  sparkles: Sparkles,
  shield: ShieldCheck,
  userStar: UserStar,
  mail: Mail,
  flag: Flag,
};
const BADGE = 40;

export type SettingsGroupProps = {
  title: string;
  rows: readonly SettingsRow[];
  onOpen: (row: SettingsRow) => void;
};

/**
 * One section of Settings: its name, then its rows on one soft rounded card —
 * each an icon in a square badge, its label, its value if it has one, and a
 * chevron — a hairline between.
 */
export function SettingsGroup({ title, rows, onOpen }: SettingsGroupProps) {
  const theme = useTheme();

  return (
    <View style={{ gap: space[8] }}>
      <SFProBody
        variant="label"
        tone="textSupporting"
        style={styles.title}
        accessibilityRole="header"
      >
        {title}
      </SFProBody>
      <Card
        testID={`settings-group-${title.toLowerCase().replace(/\s+/g, "-")}`}
        kind="list"
        style={styles.card}
      >
        {rows.map((row, index) => {
          const Icon = ICONS[row.icon];
          return (
            <Fragment key={row.testID}>
              {index > 0 && <Divider />}
              <Pressable
                testID={row.testID}
                accessibilityRole="button"
                accessibilityLabel={[row.label, row.value].filter(Boolean).join(", ")}
                onPress={() => onOpen(row)}
                style={[styles.row, { gap: space[16], paddingHorizontal: space[16] }]}
              >
                {/* On the group's own grey: no square of its own, which only added weight. */}
                <View
                  testID={`${row.testID}-icon`}
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                  style={styles.badge}
                >
                  <Icon
                    size={iconSize.row}
                    color={theme.colors.text}
                    strokeWidth={theme.icon.strokeWidth}
                  />
                </View>
                <SFProBody style={styles.label} numberOfLines={1}>
                  {row.label}
                </SFProBody>
                {row.value && <SFProBody tone="textMuted">{row.value}</SFProBody>}
                <ChevronRight
                  size={iconSize.chevron}
                  color={theme.colors.textMuted}
                  strokeWidth={theme.icon.strokeWidth}
                />
              </Pressable>
            </Fragment>
          );
        })}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { paddingHorizontal: space[4] },
  card: { overflow: "hidden" },
  row: { minHeight: controlHeight.row, flexDirection: "row", alignItems: "center" },
  badge: { width: BADGE, height: BADGE, alignItems: "center", justifyContent: "center" },
  label: { flex: 1 },
});
