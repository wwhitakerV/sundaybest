import { StyleSheet } from "react-native";

import { ListScreen } from "@/ui/organisms/ListScreen";
import { SkeletonHandoff } from "@/ui/molecules/SkeletonHandoff";
import { ScreenLoadError } from "@/ui/organisms/ScreenLoadError";
import { PlansSkeleton } from "../components/PlansSkeleton";
import { PAGE_INSET } from "@/ui/organisms/Screen";
import { FILTER_PILLS_HEIGHT, FilterPills } from "@/ui/molecules/FilterPills";
import { TitleHeader } from "@/ui/molecules/TitleHeader";
import { space } from "@/theme";
import { LibraryPlanCard } from "../components/LibraryPlanCard";
import { PlansEmpty } from "../components/PlansEmpty";
import { usePlansLibrary } from "../hooks/use-plans-library";

/**
 * The library: the user's plans, filtered by pills — All, In progress, Done,
 * Saved — each list and count derived from the API plan cache.
 */
export function PlansScreen() {
  const { filter, setFilter, filters, cards, empty, openPlan, actionFor, loading, error, retry } =
    usePlansLibrary();

  if (error) {
    return (
      <ScreenLoadError testID="plans-load-error" title="Couldn't load Plans" onRetry={retry} />
    );
  }

  const list = (pending: boolean) => (
    <ListScreen
      testID="plans-screen"
      // Fades across the filters' row and a little past it, mostly clear by the header's edge.
      headerFade={{ kind: "soft", reach: FILTER_PILLS_HEIGHT }}
      // Solid behind the title and filters: the plans never show through them.
      solidHeader
      header={
        <>
          <TitleHeader title="Plans" />

          <FilterPills
            testID="plans-filter-pills"
            options={filters}
            selected={filter}
            onSelect={setFilter}
            bleed={PAGE_INSET}
          />
        </>
      }
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

/** Room under the last plan, so it scrolls clear of the tab bar and its tint. */
const LIST_FOOT = 140;

const styles = StyleSheet.create({
  list: {
    gap: space[16],
    paddingBottom: LIST_FOOT,
  },
});
