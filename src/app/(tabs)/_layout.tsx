import { Tabs } from "expo-router";
import { Flame, House, LibraryBig, Settings2 } from "lucide-react-native";

import { TabIcon } from "@/ui/organisms/tab-bar/TabIcon";
import { TabBarAccessoryProvider } from "@/ui/organisms/tab-bar/tab-bar-accessory";
import { TabBarBannerProvider } from "@/ui/organisms/tab-bar/tab-bar-banner";
import { AppTabBar } from "@/features/home";
import { GenerationBarHost } from "@/features/plan-creation";
import { headerEntranceLayout } from "@/ui/header-entrance/HeaderEntranceScope";

export default function TabsLayout() {
  return (
    // Lets a tab's screen minimise the tab bar beside a button of its own,
    // and the plan being built float above its tabs.
    <TabBarAccessoryProvider>
      <TabBarBannerProvider>
        <GenerationBarHost />
        <Tabs
          screenOptions={{ headerShown: false }}
          screenLayout={headerEntranceLayout}
          tabBar={(props) => <AppTabBar {...props} />}
        >
          <Tabs.Screen
            name="home"
            options={{
              title: "Home",
              tabBarButtonTestID: "tab-home",
              tabBarIcon: ({ color, size }) => <TabIcon icon={House} color={color} size={size} />,
            }}
          />
          <Tabs.Screen
            name="plans"
            options={{
              title: "Plans",
              tabBarButtonTestID: "tab-plans",
              tabBarIcon: ({ color, size }) => (
                <TabIcon icon={LibraryBig} color={color} size={size} />
              ),
            }}
          />
          <Tabs.Screen
            name="progress"
            options={{
              title: "Progress",
              tabBarButtonTestID: "tab-progress",
              tabBarIcon: ({ color, size }) => <TabIcon icon={Flame} color={color} size={size} />,
            }}
          />
          <Tabs.Screen
            name="settings"
            options={{
              title: "Settings",
              tabBarButtonTestID: "tab-settings",
              tabBarIcon: ({ color, size }) => (
                <TabIcon icon={Settings2} color={color} size={size} />
              ),
            }}
          />
          {/* Hidden for now (MVP): its routes stay, it just has no tab. */}
          <Tabs.Screen name="fun" options={{ href: null }} />
        </Tabs>
      </TabBarBannerProvider>
    </TabBarAccessoryProvider>
  );
}
