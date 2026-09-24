import { Tabs } from "expo-router";
import { Brain, Flame, House, LibraryBig } from "lucide-react-native";

import { TabBar } from "@/ui/tab-bar/TabBar";
import { TabIcon } from "@/ui/tab-bar/TabIcon";
import { tapFeedback } from "@/core/haptics/haptics";
import { headerEntranceLayout } from "@/ui/HeaderEntranceScope";

export default function TabsLayout() {
  return (
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
          tabBarIcon: ({ color, size }) => <TabIcon icon={LibraryBig} color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="fun"
        options={{
          title: "Fun",
          tabBarButtonTestID: "tab-fun",
          tabBarIcon: ({ color, size }) => <TabIcon icon={Brain} color={color} size={size} />,
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
      {/* Reachable only via the header's account icon, not a tab. */}
      <Tabs.Screen name="settings" options={{ href: null }} />
    </Tabs>
  );
}
