import { useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { UserRound } from "lucide-react-native";

import { Screen } from "@/ui/Screen";
import { HeaderIconButton } from "@/ui/HeaderIconButton";
import { FilterTabs, type FilterTabOption } from "@/ui/FilterTabs";
import { useTheme } from "@/theme";
import { MOCK_PLANS } from "../mock-plans";

const FILTERS: readonly FilterTabOption[] = [
  { label: "All", count: MOCK_PLANS.length },
  { label: "In progress", count: MOCK_PLANS.filter((plan) => !plan.completed).length },
  { label: "Done", count: MOCK_PLANS.filter((plan) => plan.completed).length },
  { label: "Saved", count: 0 },
];

export function PlansScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [filter, setFilter] = useState<FilterTabOption["label"]>("All");

  return (
    <Screen testID="plans-screen" style={styles.content}>
      <View style={styles.header}>
        <Text style={[theme.typography.screenTitle, { color: theme.colors.text }]}>Plans</Text>
        <HeaderIconButton
          testID="plans-account-button"
          icon={UserRound}
          accessibilityLabel="Account"
          bordered={false}
          onPress={() => router.push("/(tabs)/settings")}
        />
      </View>

      <FilterTabs
        testID="plans-filter-tabs"
        options={FILTERS}
        selected={filter}
        onSelect={setFilter}
      />

      <Text style={[theme.typography.body, { color: theme.colors.text }]}>...</Text>

      <FlatList
        data={MOCK_PLANS}
        keyExtractor={(plan) => plan.id}
        renderItem={({ item: plan }) => (
          <Pressable
            testID={`plans-item-${plan.id}`}
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
  item: { paddingVertical: 16, borderBottomWidth: 1 },
});
