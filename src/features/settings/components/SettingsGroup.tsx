import { Fragment } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  Bell,
  BookOpen,
  ChevronRight,
  Flag,
  Mail,
  ShieldCheck,
  Sparkles,
  Type,
  type LucideIcon,
} from "lucide-react-native";

import { Divider } from "@/ui/Divider";
import { useTheme } from "@/theme";
import type { SettingsIcon, SettingsRow } from "../logic/settings-sections";

const ICONS: Record<SettingsIcon, LucideIcon> = {
  bell: Bell,
  book: BookOpen,
  type: Type,
  sparkles: Sparkles,
  shield: ShieldCheck,
  mail: Mail,
  flag: Flag,
};
const BADGE = 40;
const ICON_SIZE = 18;
const CHEVRON = 18;
const MIN_ROW_HEIGHT = 64;

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
    <View style={{ gap: theme.spacing.sm }}>
      <Text
        accessibilityRole="header"
        style={[theme.typography.label, styles.title, { color: theme.colors.textMuted }]}
      >
        {title}
      </Text>
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.hairline,
            borderRadius: theme.radii.xl,
          },
        ]}
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
                style={[styles.row, { gap: theme.spacing.md, paddingHorizontal: theme.spacing.md }]}
              >
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor: theme.colors.segmentBackground,
                      borderRadius: theme.radii.md,
                    },
                  ]}
                >
                  <Icon
                    size={ICON_SIZE}
                    color={theme.colors.text}
                    strokeWidth={theme.icon.strokeWidth}
                  />
                </View>
                <Text
                  numberOfLines={1}
                  style={[theme.typography.listItem, styles.label, { color: theme.colors.text }]}
                >
                  {row.label}
                </Text>
                {row.value && (
                  <Text style={[theme.typography.body, { color: theme.colors.textMuted }]}>
                    {row.value}
                  </Text>
                )}
                <ChevronRight
                  size={CHEVRON}
                  color={theme.colors.textMuted}
                  strokeWidth={theme.icon.strokeWidth}
                />
              </Pressable>
            </Fragment>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { paddingHorizontal: 4 },
  card: { borderWidth: 1, overflow: "hidden" },
  row: { minHeight: MIN_ROW_HEIGHT, flexDirection: "row", alignItems: "center" },
  badge: { width: BADGE, height: BADGE, alignItems: "center", justifyContent: "center" },
  label: { flex: 1 },
});
