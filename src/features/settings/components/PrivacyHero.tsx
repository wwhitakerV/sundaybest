import { StyleSheet, View } from "react-native";

import { space, useTheme } from "@/theme";
import { useFrameClearance } from "@/ui/organisms/ScrollFrame";
import { PAGE_INSET } from "@/ui/organisms/Screen";
import { MonoLabel } from "@/ui/typography/MonoLabel";
import { SerifTitle } from "@/ui/typography/SerifTitle";
import { SFProBody } from "@/ui/typography/SFProBody";

/** How far the hero's colour reaches above the page, so a pull past the top never shows white. */
const OVERSCROLL = 1000;

export type PrivacyHeroProps = {
  /** The small red label above the statement. */
  eyebrow: string;
  /** The page's one serif line. */
  statement: string;
  /** A line or two in plain words under it. */
  intro: string;
  /** When the policy took effect, for the complete policy. */
  effective?: string;
  /** How far the page can scroll before the hero has gone from under the header. */
  onReach: (reach: number) => void;
  testID: string;
};

/**
 * A privacy page's hero: compact, in soft grey, running the screen's width and
 * up under the status bar and the bar — a small red eyebrow, the page's one
 * serif statement, and a line of plain words. The answer starts right below.
 */
export function PrivacyHero({
  eyebrow,
  statement,
  intro,
  effective,
  onReach,
  testID,
}: PrivacyHeroProps) {
  const theme = useTheme();
  const { heroTop } = useFrameClearance();
  const backgroundColor = theme.colors.surface;

  return (
    <View
      testID={testID}
      onLayout={(event) => onReach(event.nativeEvent.layout.height - heroTop)}
      style={[
        styles.hero,
        {
          backgroundColor,
          gap: space[12],
          paddingTop: heroTop + space[8],
          paddingBottom: space[28],
          paddingHorizontal: PAGE_INSET,
        },
      ]}
    >
      <View style={[styles.above, { backgroundColor }]} />
      <MonoLabel variant="kicker" tone="accent">
        {eyebrow}
      </MonoLabel>
      <SerifTitle variant="statement" accessibilityRole="header">
        {statement}
      </SerifTitle>
      <SFProBody variant="bodyLoose">{intro}</SFProBody>
      {effective && (
        <SFProBody variant="detail" tone="textMuted">
          {effective}
        </SFProBody>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // Out to the screen's edges, past the page inset the scroll's content keeps.
  hero: { marginHorizontal: -PAGE_INSET },
  above: { position: "absolute", left: 0, right: 0, bottom: "100%", height: OVERSCROLL },
});
