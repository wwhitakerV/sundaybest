import { Stack } from "expo-router";

import { headerEntranceLayout } from "@/ui/header-entrance/HeaderEntranceScope";

/**
 * The stack's first page, put underneath whatever a deep link (or a link with
 * `withAnchor`) opens here — so Back always leads to it. The tab bar puts it
 * back for any other link (`stackRootReset`).
 */
export const unstable_settings = { anchor: "index" };

export default function ProgressLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }} screenLayout={headerEntranceLayout}>
      <Stack.Screen name="index" />
      {/* Dragged across, their chart, timeline and grid never start a swipe back: only the screen's edge does. */}
      <Stack.Screen name="word" options={{ fullScreenGestureEnabled: false }} />
      <Stack.Screen name="words" options={{ fullScreenGestureEnabled: false }} />
      <Stack.Screen name="quick-check" options={{ fullScreenGestureEnabled: false }} />
    </Stack>
  );
}
