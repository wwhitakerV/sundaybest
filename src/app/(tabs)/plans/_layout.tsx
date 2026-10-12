import { Stack } from "expo-router";

import { headerEntranceLayout } from "@/ui/header-entrance/HeaderEntranceScope";

/**
 * The stack's first page, put underneath whatever a deep link (or a link with
 * `withAnchor`) opens here — so Back always leads to it. The tab bar puts it
 * back for any other link (`stackRootReset`).
 */
export const unstable_settings = { anchor: "index" };

export default function PlansLayout() {
  return <Stack screenOptions={{ headerShown: false }} screenLayout={headerEntranceLayout} />;
}
