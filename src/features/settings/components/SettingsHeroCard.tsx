import { StyleSheet, View } from "react-native";
import type { LucideIcon } from "lucide-react-native";

import { radius, space, useTheme } from "@/theme";
import { Card } from "@/ui/atoms/Card";
import { MonoBody } from "@/ui/typography/MonoBody";
import { SFProBody } from "@/ui/typography/SFProBody";
import { SFProTitle } from "@/ui/typography/SFProTitle";

const ICON_BADGE = 48;
const ICON_SIZE = 22;

export type SettingsHeroCardProps = {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  detail: string;
  accent?: boolean;
  testID?: string;
};

/** A strong opening beat shared by Settings subpages: still a SundayBest Card, just with more hierarchy. */
export function SettingsHeroCard({
  icon: Icon,
  eyebrow,
  title,
  detail,
  accent = false,
  testID,
}: SettingsHeroCardProps) {
  const theme = useTheme();

  return (
    <Card
      testID={testID}
      radius={28}
      style={[
        styles.card,
        {
          gap: space[18],
          padding: space[20],
          backgroundColor: accent ? theme.colors.selectionSurface : theme.colors.surface,
          borderColor: accent ? theme.colors.selectionBorder : theme.colors.containerBorder,
        },
      ]}
    >
      <View style={styles.topRow}>
        <View
          style={[
            styles.badge,
            {
              backgroundColor: accent
                ? theme.colors.selectionBadge
                : theme.colors.segmentBackground,
              borderRadius: radius[16],
            },
          ]}
        >
          <Icon
            size={ICON_SIZE}
            color={accent ? theme.colors.accent : theme.colors.text}
            strokeWidth={theme.icon.strokeWidth}
          />
        </View>
        <MonoBody variant="supporting" tone={accent ? "accent" : "textMuted"}>
          {eyebrow.toUpperCase()}
        </MonoBody>
      </View>

      <View style={{ gap: space[8] }}>
        <SFProTitle variant="headline">{title}</SFProTitle>
        <SFProBody variant="bodyLoose" tone="textSupporting">
          {detail}
        </SFProBody>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1 },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  badge: { width: ICON_BADGE, height: ICON_BADGE, alignItems: "center", justifyContent: "center" },
});
