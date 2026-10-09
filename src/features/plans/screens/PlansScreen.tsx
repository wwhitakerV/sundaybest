import { useState } from "react";
import { StyleSheet } from "react-native";

import { ListScreen } from "@/ui/organisms/ListScreen";
import { SkeletonHandoff } from "@/ui/molecules/SkeletonHandoff";
import { ScreenLoadError } from "@/ui/organisms/ScreenLoadError";
import { PlansSkeleton } from "../components/PlansSkeleton";
import { radius, space } from "@/theme";
import { LibraryPlanCard } from "../components/LibraryPlanCard";
import { PlansEmpty } from "../components/PlansEmpty";
import { PlansHeader } from "../components/PlansHeader";
import { usePlansLibrary } from "../hooks/use-plans-library";

/**
 * The library: the user's plans from the API plan cache, under a pinned
 * header — the title, the filters (In progress and Done, each with its count)
 * centred beside it, and the search at the right. Scrolled, the filters take
 * the title's place.
 */
export function PlansScreen() {
  const {
    filters,
    filter,
    pickFilter,
    openSearch,
    cards,
    empty,
    openPlan,
    actionFor,
    loading,
    error,
    retry,
  } = usePlansLibrary();
  // Scrolled from the top: the header gives the title's room to the filters.
  const [collapsed, setCollapsed] = useState(false);

  if (error) {
    return (
      <ScreenLoadError testID="plans-load-error" title="Couldn't load Plans" onRetry={retry} />
    );
  }

  const list = (pending: boolean) => (
    <ListScreen
      testID="plans-screen"
      // The header stays pinned on solid white, nothing behind it; the cards round into its foot.
      pinned={{
        rounded: radius[28],
        bar: (
          <PlansHeader
            collapsed={collapsed}
            filters={filters}
            filter={filter}
            onPickFilter={pickFilter}
            onSearch={openSearch}
          />
        ),
      }}
      onScroll={(y) => setCollapsed(y > COLLAPSE_AT)}
      data={pending ? [] : cards}
      keyExtractor={({ plan }) => plan.id}
      contentStyle={styles.list}
      empty={
        pending ? (
          <PlansSkeleton testID="plans-content-pending" />
        ) : (
          <PlansEmpty testID="plans-empty" {...empty} />
        )
      }
      renderItem={({ item }) => (
        <LibraryPlanCard
          testID={`plans-item-${item.plan.id}`}
          thumbnailTestID={`plans-thumbnail-${item.plan.id}`}
          progressTestID={`plans-progress-${item.plan.id}`}
          title={item.plan.title}
          church={item.church}
          thumbnailUrl={item.thumbnailUrl}
          colors={item.plan.sermon.thumbnailColors}
          look={item.look}
          percent={item.percent}
          done={item.done}
          onPress={() => openPlan(item.plan.id)}
          {...actionFor(item)}
        />
      )}
    />
  );

  // The whole page hands over, so the skeleton fades out over the plans
  // (its header is the same in both, so only the list changes).
  return (
    <SkeletonHandoff testID="plans-handoff" fill pending={loading} skeleton={list(true)}>
      {list(false)}
    </SkeletonHandoff>
  );
}

/** How far the list scrolls before the title gives way to the filters. */
const COLLAPSE_AT = space[8];

/** Room under the last plan, so it scrolls clear of the tab bar and its tint. */
const LIST_FOOT = 140;

const styles = StyleSheet.create({
  list: {
    gap: space[16],
    paddingBottom: LIST_FOOT,
  },
});
