import { Stack } from "expo-router";

import { headerEntranceLayout } from "@/ui/header-entrance/HeaderEntranceScope";

/**
 * Plans' search is a full-screen modal with its own stack: a plan found opens
 * on top of the results — and the Settings pages its More menu leads to on
 * top of it — so Back returns to the search, as iOS's does.
 */
export const unstable_settings = { anchor: "index" };

export default function PlanSearchLayout() {
  return <Stack screenOptions={{ headerShown: false }} screenLayout={headerEntranceLayout} />;
}
