import { Tabs } from "expo-router";
import { FaceGrinning, Flame, House, LibraryBig } from "lucide-react-native";

import { TabBar } from "@/ui/tab-bar/TabBar";
import { TabBarVisibilityProvider } from "@/ui/tab-bar/TabBarVisibility";
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
              <FaceGrinning color={color} size={size} strokeWidth={STROKE_WIDTH} />
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
