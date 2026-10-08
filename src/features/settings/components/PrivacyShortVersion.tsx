import { Fragment } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { ChevronRight } from "lucide-react-native";

import { radius, space, useTheme } from "@/theme";
import { Divider } from "@/ui/atoms/Divider";
import { SFProBody } from "@/ui/typography/SFProBody";
import { SFProTitle } from "@/ui/typography/SFProTitle";

const CHEVRON = 20;
/** A row's height: enough to tap with ease, no more. */
const ROW = 64;

export type PrivacyShortVersionProps = {
  heading: string;
  rows: readonly { id: string; label: string; onPress: () => void }[];
  testID: string;
};

/** The short version: one white, edged card of rows, each opening its page. */
export function PrivacyShortVersion({ heading, rows, testID }: PrivacyShortVersionProps) {
  const theme = useTheme();

  return (
    <View style={{ gap: space[14] }}>
      <SFProTitle variant="section" accessibilityRole="header">
        {heading}
      </SFProTitle>
      <View
        testID={testID}
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.background,
            borderColor: theme.colors.containerBorder,
            borderRadius: radius[20],
          },
        ]}
      >
        {rows.map((row, index) => (
          <Fragment key={row.id}>
            {index > 0 && <Divider />}
            <Pressable
              testID={`${testID}-${row.id}`}
              accessibilityRole="button"
              accessibilityLabel={row.label}
              onPress={row.onPress}
              style={({ pressed }) => [
                styles.row,
                { gap: space[12], paddingHorizontal: space[18] },
                pressed && { backgroundColor: theme.colors.segmentBackground },
              ]}
            >
              <SFProBody variant="listItem" style={styles.copy}>
                {row.label}
              </SFProBody>
              <ChevronRight
                size={CHEVRON}
                color={theme.colors.textMuted}
                strokeWidth={theme.icon.strokeWidth}
              />
            </Pressable>
          </Fragment>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, overflow: "hidden" },
  row: { minHeight: ROW, flexDirection: "row", alignItems: "center" },
  copy: { flex: 1 },
});
