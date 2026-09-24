import { useState } from "react";
import { StyleSheet, View } from "react-native";

import type { Id } from "@/types/domain";
import { FilterTabs } from "@/ui/FilterTabs";
import {
  getCompletedPlans,
  getInProgressPlans,
  getLibraryPlans,
  getPlanProgress,
  getUserPlans,
  useAppSelector,
} from "@/core/store";
import { describePlan } from "../logic/describe-plan";
import { PlanRow } from "./PlanRow";

type Filter = "All" | "In progress" | "Done" | "Saved";

export type PlanListProps = {
  onOpenPlan: (planId: Id) => void;
};

/** The user's plans, filtered — all, in progress, done, or saved — each with where it stands. */
export function PlanList({ onOpenPlan }: PlanListProps) {
  const [filter, setFilter] = useState<Filter>("All");
  const lists = useAppSelector((state) => [
    { label: "All" as const, plans: getUserPlans(state) },
    { label: "In progress" as const, plans: getInProgressPlans(state) },
    { label: "Done" as const, plans: getCompletedPlans(state) },
    { label: "Saved" as const, plans: getLibraryPlans(state) },
  ]);
  const plans = lists.find((list) => list.label === filter)?.plans ?? [];
  const details = useAppSelector((state) =>
    plans.map((plan) => describePlan(plan, getPlanProgress(state, plan.id))),
  );
  const options = lists.map(({ label, plans: listed }) => ({ label, count: listed.length }));

  return (
    <View style={styles.list}>
      <FilterTabs
        testID="home-tab-plan-filters"
        options={options}
        selected={filter}
        onSelect={setFilter}
      />
      {plans.map((plan, index) => (
        <PlanRow
          key={plan.id}
          testID={`home-tab-plan-${plan.id}`}
          title={plan.title}
          detail={details.at(index) ?? ""}
          done={plan.status === "completed"}
          onPress={() => onOpenPlan(plan.id)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 12 },
});
