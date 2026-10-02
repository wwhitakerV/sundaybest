import { StyleSheet, View } from "react-native";
import { HandHeart } from "lucide-react-native";

import { space, useTheme } from "@/theme";
import { SFProTitle } from "@/ui/typography/SFProTitle";

/** The round badge beside the prayer's title. */
const BADGE_SIZE = 52;
const ICON_SIZE = 24;

export type PrayerHeadingProps = {
  title: string;
  testID?: string;
};

/** The Pray step's heading: a round badge with praying hands, and the prayer's title. */
export function PrayerHeading({ title, testID }: PrayerHeadingProps) {
  const theme = useTheme();

  return (
    <View testID={testID} style={styles.row}>
      <View
        testID={testID && `${testID}-badge`}
        style={[styles.badge, { backgroundColor: theme.colors.controlPrimary }]}
      >
        <HandHeart
          size={ICON_SIZE}
          color={theme.colors.onControlPrimary}
          strokeWidth={theme.icon.strokeWidth}
        />
      </View>
      <SFProTitle style={styles.title}>{title}</SFProTitle>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: space[14] },
  title: { flexShrink: 1 },
  badge: {
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: BADGE_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
  },
});
