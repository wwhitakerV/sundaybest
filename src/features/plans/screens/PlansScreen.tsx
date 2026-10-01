import { useState } from "react";
import { FlatList, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

import { PAGE_INSET, Screen } from "@/ui/organisms/Screen";
import { Divider } from "@/ui/atoms/Divider";
import { FilterPills } from "@/ui/molecules/FilterPills";
import { TitleHeader } from "@/ui/molecules/TitleHeader";
import { space } from "@/theme";
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
 * The library: the user's plans, filtered by pills — All, In progress, Done,
 * Saved — each list and count read from the store's selectors. The plans run
 * down the page one to a row (`LibraryPlanCard`): its sermon's thumbnail at
 * 16:9, its title, and where it stands, a thin line between each. A plan
 * opens to its overview.
 */
export function PlansScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState("All");
  const cards = useAppSelector((state) =>
    getPlansForFilter(state, filter).map((plan) => {
      const currentDayNumber = getPlanProgress(state, plan.id)?.currentDayNumber ?? 1;
      return {
        plan,
        thumbnailUrl: getSermonForPlan(state, plan.id)?.thumbnailUrl ?? null,
        look: describeLibraryPlan(plan, { currentDayNumber }),
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
      <TitleHeader title="Plans" />

      <FilterPills
        testID="plans-filter-pills"
        options={filters}
        selected={filter}
        onSelect={setFilter}
        bleed={PAGE_INSET}
      />

      <FlatList
        data={cards}
        keyExtractor={({ plan }) => plan.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => (
          <Divider testID="plans-divider" style={{ marginVertical: space[24] }} />
        )}
        renderItem={({ item: { plan, thumbnailUrl, look } }) => (
          <LibraryPlanCard
            testID={`plans-item-${plan.id}`}
            thumbnailTestID={`plans-thumbnail-${plan.id}`}
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

/** Room under the last plan, so it scrolls clear of the tab bar and its tint. */
const LIST_FOOT = 140;

const styles = StyleSheet.create({
  list: { paddingBottom: LIST_FOOT },
});
