import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Bell, UserRound } from "lucide-react-native";

import { Screen } from "@/ui/Screen";
import { HeaderIconButton } from "@/ui/HeaderIconButton";
import { useTheme } from "@/theme";
import { MOCK_PLANS } from "@/features/plans";

export function ProgressScreen() {
  const theme = useTheme();
  const router = useRouter();

  return (
    <Screen testID="progress-screen" style={styles.content}>
      <View style={styles.header}>
        <Text style={[theme.typography.screenTitle, { color: theme.colors.text }]}>Progress</Text>
        <View style={styles.headerActions}>
          <HeaderIconButton
            testID="progress-notifications-button"
            icon={Bell}
            accessibilityLabel="Notifications"
            bordered={false}
            // Mocked action only — notifications aren't built yet.
            onPress={() => undefined}
          />
          <HeaderIconButton
            testID="progress-account-button"
            icon={UserRound}
            accessibilityLabel="Account"
            bordered={false}
            onPress={() => router.push("/(tabs)/settings")}
          />
        </View>
      </View>

      <Text style={[theme.typography.body, { color: theme.colors.text }]}>...</Text>

      <FlatList
        data={MOCK_PLANS}
        keyExtractor={(plan) => plan.id}
        renderItem={({ item: plan }) => (
          <Pressable
            testID={`progress-item-${plan.id}`}
            accessibilityRole="button"
            style={[styles.item, { borderBottomColor: theme.colors.divider }]}
            onPress={() =>
              router.push({
                pathname: "/(tabs)/plans/[planId]",
                params: { planId: plan.id },
              })
            }
          >
            <Text style={[theme.typography.listItem, { color: theme.colors.text }]}>
              {plan.title}
            </Text>
          </Pressable>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 24, paddingTop: 12, gap: 16 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  item: { paddingVertical: 16, borderBottomWidth: 1 },
});
