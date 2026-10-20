import { Stack } from "expo-router";

import { statusBarLayout } from "@/features/status-bar";
import { headerEntranceLayout } from "@/ui/header-entrance/HeaderEntranceScope";

export default function StudySessionLayout() {
  // A full-screen modal covers the app's status bar, so its stack draws its own (ADR 0032).
  return (
    <Stack
      screenOptions={{ headerShown: false }}
      screenLayout={headerEntranceLayout}
      layout={statusBarLayout}
    />
  );
}
