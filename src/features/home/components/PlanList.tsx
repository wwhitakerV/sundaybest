import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";

import type { ApiPlanSummary } from "@/core/api/contracts";
import type { Id } from "@/types/domain";
import { FilterTabs } from "@/ui/molecules/FilterTabs";
import { selectionFeedback } from "@/core/haptics/haptics";
import {
  getApiCompletedPlans,
  getApiInProgressPlans,
  getApiSavedPlans,
  getApiUserPlans,
} from "@/features/plans/logic/api-plan-collections";
import { describeApiPlan } from "@/features/plans/logic/api-plan-wording";
import { PlanRow } from "./PlanRow";
import { space } from "@/theme";

type Filter = "All" | "In progress" | "Done" | "Saved";

export type PlanListProps = {
  plans: readonly ApiPlanSummary[];
  onOpenPlan: (planId: Id) => void;
};

/** The user's real API plans, filtered without duplicating server state locally. */
export function PlanList({ plans: allPlans, onOpenPlan }: PlanListProps) {
  const [filter, setFilter] = useState<Filter>("All");
  const lists = useMemo(
    () => [
      { label: "All" as const, plans: getApiUserPlans(allPlans) },
      { label: "In progress" as const, plans: getApiInProgressPlans(allPlans) },
      { label: "Done" as const, plans: getApiCompletedPlans(allPlans) },
      { label: "Saved" as const, plans: getApiSavedPlans(allPlans) },
    ],
    [allPlans],
  );
  const plans = lists.find((list) => list.label === filter)?.plans ?? [];
  const options = lists.map(({ label, plans: listed }) => ({ label, count: listed.length }));

  function selectFilter(next: Filter) {
    if (next !== filter) selectionFeedback();
    setFilter(next);
  }

  return (
    <View style={styles.list}>
      <FilterTabs
        testID="home-tab-plan-filters"
        options={options}
        selected={filter}
        onSelect={selectFilter}
      />
      {plans.map((plan) => (
        <PlanRow
          key={plan.id}
          testID={`home-tab-plan-${plan.id}`}
          title={plan.title}
          detail={describeApiPlan(plan)}
          done={plan.status === "completed"}
          onPress={() => onOpenPlan(plan.id)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: space[12] },
});
