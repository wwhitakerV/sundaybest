import { useContext, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";

import { StatusBarOverlayProvider } from "@/ui/organisms/status-bar/overlay";
import { ScrollToTopProvider } from "@/ui/organisms/status-bar/scroll-to-top";
import { StatusBarToneProvider } from "@/ui/organisms/status-bar/tone";
import { SystemStatusBar } from "./SystemStatusBar";

/**
 * A home-button iPhone's bar: hiding iOS's takes its inset with it, so the
 * page keeps this much room at its top for ours. A Face ID iPhone keeps its
 * own inset (the island or notch is still there).
 */
const HOME_BUTTON_BAR = 20;

/**
 * A navigator's frame with our status bar on top: what's asked of its tone
 * and where a tap scrolls (for the screens inside), the top inset kept for
 * it, and the bar itself — also handed to sheets and popovers drawn in a
 * `Modal`, so it stays over them as iOS's does.
 */
export function StatusBarFrame({ children }: { children: ReactNode }) {
  const insets = useContext(SafeAreaInsetsContext);
  const kept = insets && { ...insets, top: Math.max(insets.top, HOME_BUTTON_BAR) };
  const bar = <SystemStatusBar />;
  return (
    <StatusBarToneProvider>
      <ScrollToTopProvider>
        <SafeAreaInsetsContext.Provider value={kept}>
          <StatusBarOverlayProvider bar={bar}>
            <View style={styles.frame}>
              {children}
              {bar}
            </View>
          </StatusBarOverlayProvider>
        </SafeAreaInsetsContext.Provider>
      </ScrollToTopProvider>
    </StatusBarToneProvider>
  );
}

/** A navigator's `layout`, framed with our status bar (`<Stack layout={statusBarLayout} />`). */
export function statusBarLayout({ children }: { children: ReactNode }) {
  return <StatusBarFrame>{children}</StatusBarFrame>;
}

const styles = StyleSheet.create({
  frame: { flex: 1 },
});
