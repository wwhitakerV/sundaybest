import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";
import { useContext, type ReactNode } from "react";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";

import { space } from "@/theme";
import { EDGE_FADE, getFootAboveTabBar } from "@/ui/organisms/frame-edges";
import { ScrollScreen } from "@/ui/organisms/ScrollScreen";
import { SFProBody } from "@/ui/typography/SFProBody";
import { SettingsFootnote } from "./SettingsFootnote";
import { SettingsSubpageHeader } from "./SettingsSubpageHeader";

/** Between a page's last line and the tab bar. */
const TAB_BAR_GAP = space[24];
/** At least this much between a footnote and what's above it. */
const FOOTNOTE_GAP = space[40];

export type SettingsSubpageProps = {
  /** Base testID: the screen is `${testID}-screen`, the header `${testID}`. */
  testID: string;
  /** The bar's title, beside Back. */
  title?: string;
  children?: ReactNode;
  /** Between the page's blocks, from the spacing scale. */
  gap?: number;
  /**
   * The page's closing line, set apart at its foot, centred: a string, or a
   * `SettingsFootnote` in a wrapper of its own (one that reveals it).
   */
  footnote?: ReactNode;
  /** How far the footnote sits from what's above it, at least. */
  footnoteSpace?: number;
};

/**
 * The shared shell of every Settings subpage: the app's `ScrollScreen`, with
 * Back + the title floating over the page on its standard fade — the same
 * frame as Plan complete and a Quick Check's score — and a scrolling body
 * that ends 24pt above the floating tab bar. A footnote sits apart at the
 * foot, left-aligned under the cards' words: at the bottom of the screen when
 * the page is short, and a clear gap below the rest when it scrolls.
 */
export function SettingsSubpage({
  testID,
  title,
  children,
  gap = space[24],
  footnote,
  footnoteSpace = FOOTNOTE_GAP,
}: SettingsSubpageProps) {
  const router = useRouter();
  const insetBottom = useContext(SafeAreaInsetsContext)?.bottom ?? 0;
  // The last line ends TAB_BAR_GAP above the floating tab bar, which stays up over every Settings page.
  const foot = getFootAboveTabBar(insetBottom, TAB_BAR_GAP);

  return (
    <ScrollScreen
      testID={`${testID}-screen`}
      header={
        <SettingsSubpageHeader testID={testID} title={title ?? ""} onBack={() => router.back()} />
      }
      contentStyle={[styles.close, styles.fill, { paddingBottom: foot }]}
      keyboardShouldPersistTaps="handled"
    >
      {/* The gap lives on the body, so it never adds room under the last block. Above the first
          it keeps the same room it always had. */}
      <View testID={`${testID}-body`} style={{ gap, paddingTop: gap }}>
        {children ?? <SFProBody>...</SFProBody>}
      </View>
      {footnote ? (
        <View
          testID={`${testID}-footnote`}
          style={[styles.footnote, { paddingTop: footnoteSpace }]}
        >
          {typeof footnote === "string" ? <SettingsFootnote text={footnote} /> : footnote}
        </View>
      ) : null}
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  // The first block starts at the header's foot, its fade over the content rather than a gap above it.
  close: { marginTop: -EDGE_FADE },
  // The content fills the screen at least, so a short page's footnote can sit at the bottom.
  fill: { flexGrow: 1 },
  footnote: { marginTop: "auto" },
});
