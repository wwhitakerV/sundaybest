import { StyleSheet, useWindowDimensions, View, type LayoutChangeEvent } from "react-native";

import { space, useTheme } from "@/theme";
import { EDGE_FADE } from "@/ui/organisms/frame-edges";
import { PAGE_INSET } from "@/ui/organisms/Screen";
import { useHideTabBar } from "@/ui/organisms/tab-bar/tab-bar-accessory";
import { SFProBody } from "@/ui/typography/SFProBody";

/** Above the line, and between it and the home indicator's room: the same, so it sits centred in the red. */
const BAND_ROOM = space[40];
/**
 * Under the line: the frame already keeps the home indicator's inset and its
 * fade clear below the content, so the band adds the rest of `BAND_ROOM`.
 */
const BAND_FOOT = BAND_ROOM - EDGE_FADE;

export type SettingsBandProps = {
  text: string;
  /** How far it sits from what's above it, at least. */
  spaceAbove: number;
  /** Where it starts in the scroll: the foot of what's above it. */
  onLayout: (y: number) => void;
  testID: string;
};

/**
 * A subpage's closing line on a band of the app's red, white and centred,
 * edge to edge — out past the page's inset — and down to the screen's foot,
 * the tab bar stepping away for it. Below that it runs on in red, so pulling
 * past the end never shows white.
 */
export function SettingsBand({ text, spaceAbove, onLayout, testID }: SettingsBandProps) {
  const theme = useTheme();
  // The red runs to the screen's foot: the tab bar steps away while it's shown.
  useHideTabBar(true);
  const { height } = useWindowDimensions();

  return (
    <View
      testID={testID}
      onLayout={(event: LayoutChangeEvent) => onLayout(event.nativeEvent.layout.y)}
      style={[styles.band, { paddingTop: spaceAbove }]}
    >
      <View
        testID={`${testID}-fill`}
        style={[
          styles.fill,
          {
            backgroundColor: theme.colors.accent,
            paddingTop: BAND_ROOM,
            paddingBottom: BAND_FOOT,
          },
        ]}
      >
        {/* First, so the line is drawn over it; hung wholly below the band by its own height. */}
        <View
          testID={`${testID}-runoff`}
          style={[styles.runoff, { height, bottom: -height, backgroundColor: theme.colors.accent }]}
        />
        <SFProBody tone="onAccent" style={styles.line}>
          {text}
        </SFProBody>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // A short page's band sits at the screen's foot.
  band: { marginTop: "auto" },
  fill: { marginHorizontal: -PAGE_INSET, paddingHorizontal: PAGE_INSET },
  line: { textAlign: "center" },
  runoff: { position: "absolute", left: 0, right: 0 },
});
