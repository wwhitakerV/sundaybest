import { Tabs } from "expo-router";
import { Flame, House, LibraryBig, UserRound } from "lucide-react-native";

import { TabBar } from "@/ui/tab-bar/TabBar";
import { TabIcon } from "@/ui/tab-bar/TabIcon";
import { TabBarAccessoryProvider } from "@/ui/tab-bar/tab-bar-accessory";
import { tapFeedback } from "@/core/haptics/haptics";
import { headerEntranceLayout } from "@/ui/HeaderEntranceScope";

export default function TabsLayout() {
  return (
    // Lets a tab's screen minimise the tab bar beside a button of its own.
    <TabBarAccessoryProvider>
      <Tabs
        screenOptions={{ headerShown: false }}
        screenLayout={headerEntranceLayout}
        tabBar={(props) => <TabBar {...props} onPress={tapFeedback} />}
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
            tabBarIcon: ({ color, size }) => <TabIcon icon={UserRound} color={color} size={size} />,
          }}
        />
        {/* Hidden for now (MVP): its routes stay, it just has no tab. */}
        <Tabs.Screen name="fun" options={{ href: null }} />
      </Tabs>
    </TabBarAccessoryProvider>
  );
}
