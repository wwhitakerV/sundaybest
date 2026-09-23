import { Tabs } from "expo-router";
import { Brain, Flame, House, LibraryBig } from "lucide-react-native";

import { TabBar } from "@/ui/TabBar";
import { TabBarVisibilityProvider } from "@/ui/TabBarVisibility";
import { tapFeedback } from "@/core/haptics/haptics";

const STROKE_WIDTH = 2;

export default function TabsLayout() {
  return (
    <TabBarVisibilityProvider>
      <Tabs
        screenOptions={{ headerShown: false }}
        tabBar={(props) => <TabBar {...props} onPress={tapFeedback} />}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: "Home",
            tabBarButtonTestID: "tab-home",
            tabBarIcon: ({ color, size }) => (
              <House color={color} size={size} strokeWidth={STROKE_WIDTH} />
            ),
          }}
        />
        <Tabs.Screen
          name="plans"
          options={{
            title: "Plans",
            tabBarButtonTestID: "tab-plans",
            tabBarIcon: ({ color, size }) => (
              <LibraryBig color={color} size={size} strokeWidth={STROKE_WIDTH} />
            ),
          }}
        />
        <Tabs.Screen
          name="fun"
          options={{
            title: "Fun",
            tabBarButtonTestID: "tab-fun",
            tabBarIcon: ({ color, size }) => (
              <Brain color={color} size={size} strokeWidth={STROKE_WIDTH} />
            ),
          }}
        />
        <Tabs.Screen
          name="progress"
          options={{
            title: "Progress",
            tabBarButtonTestID: "tab-progress",
            tabBarIcon: ({ color, size }) => (
              <Flame color={color} size={size} strokeWidth={STROKE_WIDTH} />
            ),
          }}
        />
        {/* Reachable only via the header's account icon, not a tab. */}
        <Tabs.Screen name="settings" options={{ href: null }} />
      </Tabs>
    </TabBarVisibilityProvider>
  );
}
