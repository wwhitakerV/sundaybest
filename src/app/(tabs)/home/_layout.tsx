import { Stack } from "expo-router";

import { headerEntranceLayout } from "@/ui/header-entrance/HeaderEntranceScope";

/**
 * The stack's first page, put underneath whatever a deep link (or a link with
 * `withAnchor`) opens here — so Back always leads to it. The tab bar puts it
 * back for any other link (`stackRootReset`).
 */
export const unstable_settings = { anchor: "index" };

/**
 * Home's own stack, so Plan Detail can be pushed from Home's plan card within
 * the same native stack — what iOS's zoom transition needs (it doesn't run
 * across tabs).
 */
export default function HomeLayout() {
  return <Stack screenOptions={{ headerShown: false }} screenLayout={headerEntranceLayout} />;
}
