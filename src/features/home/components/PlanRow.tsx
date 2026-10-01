import { Pressable, StyleSheet, View } from "react-native";
import { Check, ChevronRight } from "lucide-react-native";

import { radius, space, useTheme } from "@/theme";
import { SFProBody } from "@/ui/typography/SFProBody";

const ART_SIZE = 64;

export type PlanRowProps = {
  title: string;
  /** The line under the title: "Day 2 of 6", "Finished Sep 5", "Sample plan, 5 days". */
  detail: string;
  /** Finished plans end in a check; the rest in a chevron. */
  done: boolean;
  onPress: () => void;
  testID: string;
};

/** One plan in a list: its art, title, where it stands, and a way in. */
export function PlanRow({ title, detail, done, onPress, testID }: PlanRowProps) {
  const theme = useTheme();

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${detail}`}
      onPress={onPress}
      style={[
        styles.row,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.divider },
      ]}
    >
      <View style={[styles.art, { backgroundColor: theme.colors.segmentBackground }]} />
      <View style={styles.text}>
        <SFProBody variant="listItem" numberOfLines={1}>
          {title}
        </SFProBody>
        <SFProBody tone="textMuted">{detail}</SFProBody>
      </View>
      {done ? (
        <View style={[styles.done, { backgroundColor: theme.colors.controlPrimary }]}>
          <Check
            size={18}
            color={theme.colors.onControlPrimary}
            strokeWidth={theme.icon.strokeWidth}
          />
        </View>
      ) : (
        <ChevronRight
          size={22}
          color={theme.colors.textMuted}
          strokeWidth={theme.icon.strokeWidth}
        />
      )}
    </Pressable>
  );
}

/** The round "done" mark at a finished plan's end. */
const DONE_SIZE = 36;

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: space[16],
    borderWidth: 1,
    borderRadius: radius[28],
    padding: space[16],
    paddingRight: space[20],
  },
  art: { width: ART_SIZE, height: ART_SIZE, borderRadius: radius[16] },
  text: { flex: 1, gap: space[2] },
  done: {
    width: DONE_SIZE,
    height: DONE_SIZE,
    borderRadius: DONE_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
  },
});
