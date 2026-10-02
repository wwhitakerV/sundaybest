import { FlatList, StyleSheet } from "react-native";

import { PAGE_INSET, Screen } from "@/ui/organisms/Screen";
import { FilterPills } from "@/ui/molecules/FilterPills";
import { TitleHeader } from "@/ui/molecules/TitleHeader";
import { space } from "@/theme";
import { LibraryPlanCard } from "../components/LibraryPlanCard";
import { PlansEmpty } from "../components/PlansEmpty";
import { usePlansLibrary } from "../hooks/use-plans-library";

/**
 * The library: the user's plans, filtered by pills — All, In progress, Done,
 * Saved — each list and count read from the store's selectors. The plans run
 * down the page one to a card (`LibraryPlanCard`): its sermon's thumbnail at
 * 16:9, a dial of how much is done beside its title, and where it stands —
 * with Continue (a plan under way) or Start (one not started) straight into
 * its study. A card opens its plan's overview. A filter with nothing in it
 * says so (`PlansEmpty`).
 */
export function PlansScreen() {
  const { filter, setFilter, filters, cards, empty, openPlan, actionFor } = usePlansLibrary();

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
        contentContainerStyle={[styles.list, { gap: space[16] }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<PlansEmpty testID="plans-empty" {...empty} />}
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
    </Screen>
  );
}

/** Room under the last plan, so it scrolls clear of the tab bar and its tint. */
const LIST_FOOT = 140;

const styles = StyleSheet.create({
  list: { paddingBottom: LIST_FOOT },
});
