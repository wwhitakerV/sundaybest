import { useState } from "react";
import { FlatList, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { UserRound } from "lucide-react-native";

import { Screen } from "@/ui/Screen";
import { HeaderIconButton } from "@/ui/HeaderIconButton";
import { FilterTabs } from "@/ui/FilterTabs";
import { TitleHeader } from "@/ui/TitleHeader";
import {
  getCompletedPlans,
  getInProgressPlans,
  getLibraryPlans,
  getPlanProgress,
  getSermonForPlan,
  getUserPlans,
  useAppSelector,
} from "@/core/store";
import { LibraryPlanCard } from "../components/LibraryPlanCard";
import { describeLibraryPlan } from "../logic/library";
import { getPlanFilterOptions, getPlansForFilter } from "../logic/plan-filters";
import { planOverviewHref } from "../logic/routes";

/**
 * The library: the user's plans, filtered — All, In progress, Done, Saved —
 * each list and count read from the store's selectors. Each plan is a card
 * showing where it stands (the day it's on, or when it finished) and opens
 * the plan.
 */
export function PlansScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState("All");
  const cards = useAppSelector((state) =>
    getPlansForFilter(state, filter).map((plan) => ({
      plan,
      thumbnailUrl: getSermonForPlan(state, plan.id)?.thumbnailUrl ?? null,
      look: describeLibraryPlan(plan, {
        currentDayNumber: getPlanProgress(state, plan.id)?.currentDayNumber ?? 1,
      }),
    })),
  );
  const filters = useAppSelector((state) =>
    getPlanFilterOptions({
      all: getUserPlans(state).length,
      inProgress: getInProgressPlans(state).length,
      done: getCompletedPlans(state).length,
      saved: getLibraryPlans(state).length,
    }),
  );

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
        options={filters}
        selected={filter}
        onSelect={setFilter}
      />

      <FlatList
        data={cards}
        keyExtractor={({ plan }) => plan.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: { plan, thumbnailUrl, look } }) => (
          <LibraryPlanCard
            testID={`plans-item-${plan.id}`}
            title={plan.title}
            thumbnailUrl={thumbnailUrl}
            look={look}
            onPress={() => router.push(planOverviewHref(plan.id))}
          />
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: 16, paddingBottom: 140 },
});
