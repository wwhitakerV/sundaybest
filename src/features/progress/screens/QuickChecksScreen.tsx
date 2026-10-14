import { StyleSheet } from "react-native";

import { space } from "@/theme";
import { Skeleton } from "@/ui/molecules/Skeleton";
import { SkeletonLines } from "@/ui/molecules/SkeletonLines";
import { KEYBOARD_BAR_ROOM } from "@/ui/organisms/KeyboardBar";
import { ListScreen } from "@/ui/organisms/ListScreen";
import { ListSearchBar } from "@/ui/organisms/ListSearchBar";
import { ListSearchHeader } from "@/ui/organisms/ListSearchHeader";
import { ScreenLoadError } from "@/ui/organisms/ScreenLoadError";
import { SFProBody } from "@/ui/typography/SFProBody";
import { PlanGroupCard } from "../components/PlanGroupCard";
// The dots, kept to bring back: import { QuickCheckBlock } from "../components/QuickCheckBlock";
import { QuickCheckCapsule } from "../components/QuickCheckCapsule";
import { useQuickChecksList } from "../hooks/use-quick-checks-list";

type Plan = ReturnType<typeof useQuickChecksList>["plans"][number];

/**
 * Every Quick Check finished, full screen — zoomed out of the Quick Check
 * page's button: under each plan, its Quick Checks, each its passage, day
 * and how many it held. From ten, a search springs in beside the close
 * (`ListSearchHeader`), its field on the keyboard. A row opens its results;
 * only the close leaves.
 */
export function QuickChecksScreen() {
  const view = useQuickChecksList();

  if (view.error) {
    return (
      <ScreenLoadError
        testID="quick-checks-load-error"
        title="Couldn't load your Quick Checks"
        onRetry={view.retry}
        leave={{ label: "Close", onPress: view.close }}
      />
    );
  }

  const empty = view.loading ? (
    <Skeleton testID="quick-checks-pending" style={{ gap: space[16] }}>
      <SkeletonLines count={3} />
      <SkeletonLines count={3} />
    </Skeleton>
  ) : view.noMatch ? (
    <SFProBody variant="reading" tone="textInactive" testID="quick-checks-no-match">
      {`Nothing matches “${view.noMatch}”.`}
    </SFProBody>
  ) : null;

  return (
    <ListScreen<Plan>
      testID="quick-checks-screen"
      // A swipe down with the keyboard up only puts the keyboard away.
      keyboardDismissMode="on-drag"
      header={
        <ListSearchHeader
          testID="quick-checks"
          title="All Quick Checks"
          searchable={view.searchable}
          searching={view.searching}
          searchLabel="Search your Quick Checks"
          onSearch={view.openSearch}
          onClose={view.close}
        />
      }
      {...(view.searching && {
        overlay: (
          <ListSearchBar
            testID="quick-checks"
            label="Search your Quick Checks"
            words={view.search}
            onChange={view.setSearch}
            onLeave={view.leaveSearch}
            onClose={view.closeSearch}
          />
        ),
      })}
      data={view.loading ? [] : view.plans}
      keyExtractor={(plan) => plan.planId}
      gap={space[12]}
      // With the search open, the last plan ends clear of its bar.
      contentStyle={[
        styles.list,
        view.searching && { paddingBottom: space[40] + KEYBOARD_BAR_ROOM },
      ]}
      {...(empty && { empty })}
      renderItem={({ item }) => (
        <PlanGroupCard
          testID="quick-checks-row"
          title={item.title}
          thumbnailUrl={item.thumbnailUrl}
          rows={item.rows.map((row) => ({
            id: row.quizId,
            title: row.reference,
            detail: `Day ${row.dayNumber} · ${row.standing}`,
            // The day's block, small: how it went, at a glance down the list.
            // The dots, kept to bring back: picture: <QuickCheckBlock dots={row.dots} size="small" />,
            picture: <QuickCheckCapsule dots={row.dots} size="small" />,
          }))}
          onOpen={(quizId) => {
            const row = item.rows.find((candidate) => candidate.quizId === quizId);
            if (row) view.open(item.planId, row.dayNumber);
          }}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: space[40] },
});
