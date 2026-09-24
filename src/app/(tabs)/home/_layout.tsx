import { Stack } from "expo-router";

import { headerEntranceLayout } from "@/ui/HeaderEntranceScope";

/**
 * Home's own stack, so Plan Detail can be pushed from Home's plan card within
 * the same native stack — what iOS's zoom transition needs (it doesn't run
 * across tabs).
 */
export default function HomeLayout() {
  return <Stack screenOptions={{ headerShown: false }} screenLayout={headerEntranceLayout} />;
}
