import { Stack } from "expo-router";

import { headerEntranceLayout } from "@/ui/header-entrance/HeaderEntranceScope";

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
