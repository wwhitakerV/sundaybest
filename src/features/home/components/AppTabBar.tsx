import { useRouter } from "expo-router";
import type { BottomTabBarProps } from "expo-router/build/react-navigation/bottom-tabs";

import { tapFeedback } from "@/core/haptics/haptics";
import { TabBar } from "@/ui/organisms/tab-bar/TabBar";
import { NEW_PLAN_HREF } from "@/entities/plan";

/** The half sheets that open over the tabs, by route name (the root layout's `HALF_SHEET_OPTIONS`). */
const HALF_SHEET_ROUTES = ["generation"] as const;

/**
 * The app's tab bar: the generic `TabBar`, with a tap's feel on every press
 * and its floating button starting a new plan. The tabs layout renders it.
 */
export function AppTabBar(props: BottomTabBarProps) {
  const router = useRouter();

  return (
    <TabBar
      {...props}
      onPress={tapFeedback}
      fab={{ label: "New plan", onPress: () => router.push(NEW_PLAN_HREF) }}
      // The plan being built opens as a half sheet: the bar stays under it, as iOS's does.
      staysUnder={HALF_SHEET_ROUTES}
    />
  );
}
