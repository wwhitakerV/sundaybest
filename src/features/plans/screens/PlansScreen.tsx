import { useState } from "react";
import { FlatList, Pressable, StyleSheet, Text } from "react-native";
import { useRouter } from "expo-router";
import { UserRound } from "lucide-react-native";

import { Screen } from "@/ui/Screen";
import { HeaderIconButton } from "@/ui/HeaderIconButton";
import { FilterTabs } from "@/ui/FilterTabs";
import { TitleHeader } from "@/ui/TitleHeader";
import { useTheme } from "@/theme";
import { getPlanFilterOptions } from "../logic/plan-filters";
import { planOverviewHref } from "../logic/routes";
import { MOCK_PLANS } from "../mock-plans";

const FILTERS = getPlanFilterOptions(MOCK_PLANS);

export function PlansScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [filter, setFilter] = useState("All");

  return (
    <Screen testID="plans-screen" padded>
      <TitleHeader
        title="Plans"
        actions={
          <HeaderIconButton
            testID="plans-account-button"
            icon={UserRound}
            accessibilityLabel="Account"
            bordered={false}
            onPress={() => router.push("/(tabs)/settings")}
          />
        }
      />

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
            onPress={() => router.push(planOverviewHref(plan.id))}
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
  item: { paddingVertical: 16, borderBottomWidth: 1 },
});
