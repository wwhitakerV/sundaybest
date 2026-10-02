import { StyleSheet, View } from "react-native";
import { Clock } from "lucide-react-native";

import { space, useTheme } from "@/theme";
import { Card } from "@/ui/atoms/Card";
import { SFProBody } from "@/ui/typography/SFProBody";

/** The clock's round disc. */
const DISC = 56;
const ICON_SIZE = 26;

export type NextDayCardProps = {
  /** The next day's reading title. */
  title: string;
  /** "Tomorrow at 6:30 AM". */
  when: string;
  testID?: string;
};

/** What the next day holds, and when: a clock beside "Up next: …" and its time. */
export function NextDayCard({ title, when, testID }: NextDayCardProps) {
  const theme = useTheme();

  return (
    <Card testID={testID} style={styles.card}>
      <View style={[styles.disc, { backgroundColor: theme.colors.segmentBackground }]}>
        <Clock
          size={ICON_SIZE}
          color={theme.colors.textMuted}
          strokeWidth={theme.icon.strokeWidth}
        />
      </View>
      <View style={styles.words}>
        <SFProBody variant="listItem" numberOfLines={1}>{`Up next: ${title}`}</SFProBody>
        <SFProBody tone="textMuted">{when}</SFProBody>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: "row", alignItems: "center", gap: space[16], padding: space[20] },
  disc: {
    width: DISC,
    height: DISC,
    borderRadius: DISC / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  words: { flex: 1, gap: space[2] },
});
