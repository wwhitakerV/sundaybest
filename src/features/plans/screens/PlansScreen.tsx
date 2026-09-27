import { useState } from "react";
import { FlatList, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { UserRound } from "lucide-react-native";

import { Screen } from "@/ui/Screen";
import { HeaderIconButton } from "@/ui/HeaderIconButton";
import { FilterTabs } from "@/ui/FilterTabs";
import { TitleHeader } from "@/ui/TitleHeader";
import { useTheme } from "@/theme";
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
import { describeLibraryPlan, getLibraryPlanActionHref } from "../logic/library";
import { getPlanFilterOptions, getPlansForFilter } from "../logic/plan-filters";
import { planOverviewHref } from "../logic/routes";

/**
 * The library: the user's plans, filtered — All, In progress, Done, Saved —
 * each list and count read from the store's selectors. The plans run down
 * the page one to a row, each a large card in its sermon's colours
 * (`LibraryPlanCard`) showing where it stands: the card opens the
 * plan, its button goes straight into the day it's on (or, finished, to the
 * plan to review).
 */
export function PlansScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [filter, setFilter] = useState("All");
  const gap = theme.spacing.sm;
  const cards = useAppSelector((state) =>
    getPlansForFilter(state, filter).map((plan) => {
      const sermon = getSermonForPlan(state, plan.id);
      const currentDayNumber = getPlanProgress(state, plan.id)?.currentDayNumber ?? 1;
      return {
        plan,
        thumbnailUrl: sermon?.thumbnailUrl ?? null,
        colors: sermon?.thumbnailColors ?? [],
        look: describeLibraryPlan(plan, { currentDayNumber }),
        actionHref: getLibraryPlanActionHref(plan, currentDayNumber),
      };
    }),
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
        contentContainerStyle={[styles.list, { gap }]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: { plan, thumbnailUrl, colors, look, actionHref } }) => (
          <LibraryPlanCard
            testID={`plans-item-${plan.id}`}
            actionTestID={`plans-action-${plan.id}`}
            title={plan.title}
            thumbnailUrl={thumbnailUrl}
            colors={colors}
            look={look}
            onPress={() => router.push(planOverviewHref(plan.id))}
            onAction={() => router.push(actionHref)}
          />
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: 140 },
});
