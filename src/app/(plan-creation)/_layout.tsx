import { Stack } from "expo-router";

import { headerEntranceLayout } from "@/ui/HeaderEntranceScope";

export default function PlanCreationLayout() {
  return <Stack screenOptions={{ headerShown: false }} screenLayout={headerEntranceLayout} />;
}
