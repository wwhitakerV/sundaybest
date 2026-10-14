import { StyleSheet, View } from "react-native";

import { space } from "@/theme";
import { FilterPills } from "@/ui/molecules/FilterPills";
import { Skeleton } from "@/ui/molecules/Skeleton";
import { SkeletonLines } from "@/ui/molecules/SkeletonLines";
import { KEYBOARD_BAR_ROOM } from "@/ui/organisms/KeyboardBar";
import { ListScreen } from "@/ui/organisms/ListScreen";
import { ListSearchBar } from "@/ui/organisms/ListSearchBar";
import { ListSearchHeader } from "@/ui/organisms/ListSearchHeader";
import { PAGE_INSET } from "@/ui/organisms/Screen";
import { ScreenLoadError } from "@/ui/organisms/ScreenLoadError";
import { SFProBody } from "@/ui/typography/SFProBody";
import { WeekCardRow } from "../components/WeekCardRow";
import { useWeeksBrowser } from "../hooks/use-weeks-browser";
import type { WeekCard } from "../logic/week-history";

type Row =
  { kind: "month"; key: string; title: string } | { kind: "week"; key: string; card: WeekCard };

/**
 * Every week a plan ran in, full screen — zoomed out of Progress's dates —
 * made for finding one again: its title and close, with a search beside the
 * close from eight weeks (`ListSearchHeader`, its field on the keyboard);
 * past a year, the years under it as Plans' filter pills; and the weeks under
 * their months, each a card with what helps place it. From a week, see it on
 * Progress or open one of its plans.
 */
export function WeeksScreen() {
  const view = useWeeksBrowser();

  if (view.error) {
    return (
      <ScreenLoadError
        testID="weeks-load-error"
        title="Couldn't load your weeks"
        onRetry={view.retry}
        leave={{ label: "Close", onPress: view.close }}
      />
    );
  }

  const empty = view.loading ? (
    <Skeleton testID="weeks-pending" style={{ gap: space[16] }}>
      <SkeletonLines count={3} />
      <SkeletonLines count={3} />
    </Skeleton>
  ) : view.noMatch ? (
    <SFProBody variant="reading" tone="textInactive" testID="weeks-no-match">
      {`Nothing matches “${view.noMatch}”.`}
    </SFProBody>
  ) : null;

  const rows: Row[] = view.months.flatMap((month) => [
    { kind: "month", key: `month-${month.month}`, title: month.month } as const,
    ...month.cards.map((card) => ({ kind: "week", key: card.weekStart, card }) as const),
  ]);

  return (
    <ListScreen<Row>
      testID="weeks-screen"
      // A swipe down with the keyboard up only puts the keyboard away.
      keyboardDismissMode="on-drag"
      header={
        <>
          <ListSearchHeader
            testID="weeks"
            title="Weeks"
            searchable={view.searchable}
            searching={view.searching}
            searchLabel="Search your weeks"
            onSearch={view.openSearch}
            onClose={view.close}
          />
          {view.years && view.year && (
            <FilterPills
              testID="weeks-years"
              tight
              options={view.years.map((label) => ({ label }))}
              selected={view.year}
              onSelect={view.pickYear}
              bleed={PAGE_INSET}
            />
          )}
        </>
      }
      {...(view.searching && {
        overlay: (
          <ListSearchBar
            testID="weeks"
            label="Search your weeks"
            words={view.search}
            onChange={view.setSearch}
            onLeave={view.leaveSearch}
            onClose={view.closeSearch}
          />
        ),
      })}
      data={view.loading ? [] : rows}
      keyExtractor={(row) => row.key}
      itemType={(row) => row.kind}
      gap={space[12]}
      // With the search open, the last week ends clear of its bar.
      contentStyle={[
        styles.list,
        view.searching && { paddingBottom: space[40] + KEYBOARD_BAR_ROOM },
      ]}
      {...(empty && { empty })}
      renderItem={({ item }) =>
        item.kind === "month" ? (
          <View style={styles.month}>
            <SFProBody variant="label" tone="textSupporting" accessibilityRole="header">
              {item.title}
            </SFProBody>
          </View>
        ) : (
          <WeekCardRow card={item.card} onSeeWeek={view.seeWeek} onOpenPlan={view.openPlan} />
        )
      }
    />
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: space[40] },
  // A month's name, as Settings names a group: small, muted, a little room above it.
  month: { paddingTop: space[12], paddingHorizontal: space[4] },
});
