import { StyleSheet, View } from "react-native";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react-native";

import { radius, space, useTheme } from "@/theme";
import { Card } from "@/ui/atoms/Card";
import { SFProBody } from "@/ui/typography/SFProBody";
import { SFProTitle } from "@/ui/typography/SFProTitle";

const ICON_BADGE = 44;
const ICON_SIZE = 20;

export type SettingsInfoBlockProps = {
  icon: LucideIcon;
  title: string;
  body: string;
  accent?: boolean;
  children?: ReactNode;
  testID?: string;
};

/** A compact explanatory block used for privacy and plan-generation details. */
export function SettingsInfoBlock({
  icon: Icon,
  title,
  body,
  accent = false,
  children,
  testID,
}: SettingsInfoBlockProps) {
  const theme = useTheme();

  return (
    <Card
      testID={testID}
      radius={24}
      style={[
        styles.card,
        {
          gap: space[14],
          padding: space[18],
          backgroundColor: accent ? theme.colors.selectionSurface : theme.colors.surface,
          borderColor: accent ? theme.colors.selectionBorder : theme.colors.containerBorder,
        },
      ]}
    >
      <View style={[styles.row, { gap: space[14] }]}>
        <View
          style={[
            styles.badge,
            {
              backgroundColor: accent
                ? theme.colors.selectionBadge
                : theme.colors.segmentBackground,
              borderRadius: radius[14],
            },
          ]}
        >
          <Icon
            size={ICON_SIZE}
            color={accent ? theme.colors.accent : theme.colors.text}
            strokeWidth={theme.icon.strokeWidth}
          />
        </View>
        <View style={[styles.copy, { gap: space[4] }]}>
          <SFProTitle variant="smallCardTitle">{title}</SFProTitle>
          <SFProBody variant="detail" tone="textSupporting">
            {body}
          </SFProBody>
        </View>
      </View>
      {children}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1 },
  row: { flexDirection: "row", alignItems: "flex-start" },
  copy: { flex: 1 },
  badge: { width: ICON_BADGE, height: ICON_BADGE, alignItems: "center", justifyContent: "center" },
});
