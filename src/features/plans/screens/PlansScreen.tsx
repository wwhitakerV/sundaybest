import { StyleSheet } from "react-native";

import { ListScreen } from "@/ui/organisms/ListScreen";
import { ScreenLoadError } from "@/ui/organisms/ScreenLoadError";
import { ContentPending } from "@/ui/molecules/ContentPending";
import { PAGE_INSET } from "@/ui/organisms/Screen";
import { FilterPills } from "@/ui/molecules/FilterPills";
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

  return (
    <ListScreen
      testID="plans-screen"
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
      data={cards}
      keyExtractor={({ plan }) => plan.id}
      contentStyle={styles.list}
      empty={
        loading ? (
          <ContentPending testID="plans-content-pending" />
        ) : (
          <PlansEmpty testID="plans-empty" {...empty} />
        )
      }
      renderItem={({ item }) => (
        <LibraryPlanCard
          testID={`plans-item-${item.plan.id}`}
          thumbnailTestID={`plans-thumbnail-${item.plan.id}`}
          progressTestID={`plans-progress-${item.plan.id}`}
          actionTestID={`plans-action-${item.plan.id}`}
          title={item.plan.title}
          church={item.church}
          thumbnailUrl={item.thumbnailUrl}
          look={item.look}
          percent={item.percent}
          done={item.done}
          onPress={() => openPlan(item.plan.id)}
          {...actionFor(item)}
        />
      )}
    />
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
