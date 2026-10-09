import { StyleSheet, View } from "react-native";
import { X } from "lucide-react-native";

import { space } from "@/theme";
import { HeaderIconButton } from "@/ui/atoms/HeaderIconButton";
import { FilterPills } from "@/ui/molecules/FilterPills";
import { SearchField } from "@/ui/molecules/SearchField";
import { Skeleton } from "@/ui/molecules/Skeleton";
import { SkeletonLines } from "@/ui/molecules/SkeletonLines";
import { ListScreen } from "@/ui/organisms/ListScreen";
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
 * made for finding one again: no title — a search across the top, beside the
 * close; past a year, the years under it as Plans' filter pills; and the weeks
 * under their months, each a card with what helps place it. From a week, see
 * it on Progress or open one of its plans.
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
      header={
        <>
          {/* No title: the search runs the width, up to the close, and the years sit under it. */}
          <View testID="weeks" style={[styles.searchRow, { gap: space[12] }]}>
            <View style={styles.search}>
              <SearchField
                testID="weeks-search"
                accessibilityLabel="Search your weeks"
                placeholder="Search anything"
                value={view.search}
                onChange={view.setSearch}
              />
            </View>
            <HeaderIconButton
              testID="weeks-close-button"
              icon={X}
              accessibilityLabel="Close"
              onPress={view.close}
            />
          </View>
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
      data={view.loading ? [] : rows}
      keyExtractor={(row) => row.key}
      contentStyle={styles.list}
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
  searchRow: { flexDirection: "row", alignItems: "center" },
  search: { flex: 1 },
  list: { gap: space[12], paddingBottom: space[40] },
  // A month's name, as Settings names a group: small, muted, a little room above it.
  month: { paddingTop: space[12], paddingHorizontal: space[4] },
});
