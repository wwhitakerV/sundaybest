import { useRouter } from "expo-router";
import { StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import type { ReactNode } from "react";

import { space } from "@/theme";
import { FLOATING_NAV_BAR_CLEARANCE } from "@/ui/organisms/floatingNavBar";
import { EDGE_FADE } from "@/ui/organisms/frame-edges";
import { ScrollScreen } from "@/ui/organisms/ScrollScreen";
import { SFProBody } from "@/ui/typography/SFProBody";
import { SettingsSubpageHeader } from "./SettingsSubpageHeader";

export type SettingsSubpageProps = {
  /** Base testID: the screen is `${testID}-screen`, the header `${testID}`. */
  testID: string;
  /** The bar's title. A page that heads itself (Privacy policy's) leaves it out, keeping only Back. */
  title?: string;
  children?: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  /**
   * The page opens with a hero of its own colour reaching the top of the
   * screen. While it's under the header (`overHero`) the header has no
   * backdrop; `onScroll` says how far down the page is.
   */
  hero?: { overHero: boolean; onScroll: (y: number) => void };
};

/**
 * The shared shell of every Settings subpage: the app's `ScrollScreen`, with
 * Back + the title floating over the page on its standard fade — the same
 * frame as Plan complete and a Quick Check's score — and a scrolling body.
 */
export function SettingsSubpage({
  testID,
  title,
  children,
  contentStyle,
  hero,
}: SettingsSubpageProps) {
  const router = useRouter();

  return (
    <ScrollScreen
      testID={`${testID}-screen`}
      header={
        <SettingsSubpageHeader testID={testID} title={title ?? ""} onBack={() => router.back()} />
      }
      {...(hero && {
        heroUnderHeader: true,
        headerBackdrop: !hero.overHero,
        onScroll: hero.onScroll,
      })}
      contentStyle={[styles.content, hero ? styles.heroFoot : styles.close, contentStyle]}
      keyboardShouldPersistTaps="handled"
    >
      {children ?? <SFProBody>...</SFProBody>}
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  // Clear of the floating tab bar, which stays up over every Settings page.
  content: { gap: space[24], paddingBottom: FLOATING_NAV_BAR_CLEARANCE + space[32] },
  // The first block starts at the header's foot, its fade over the content rather than a gap above it.
  close: { marginTop: -EDGE_FADE },
  // A reading page with a hero ends sooner: its last words need no extra room above the tab bar.
  heroFoot: { paddingBottom: FLOATING_NAV_BAR_CLEARANCE },
});
