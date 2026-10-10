import { StyleSheet } from "react-native";
import { X } from "lucide-react-native";

import { space } from "@/theme";
import { HeaderIconButton } from "@/ui/atoms/HeaderIconButton";
import { Skeleton } from "@/ui/molecules/Skeleton";
import { SkeletonLines } from "@/ui/molecules/SkeletonLines";
import { TitleHeader } from "@/ui/molecules/TitleHeader";
import { ListScreen } from "@/ui/organisms/ListScreen";
import { ScreenLoadError } from "@/ui/organisms/ScreenLoadError";
import { PlanGroupCard } from "../components/PlanGroupCard";
// The dots, kept to bring back: import { QuickCheckBlock } from "../components/QuickCheckBlock";
import { QuickCheckCapsule } from "../components/QuickCheckCapsule";
import { useQuickChecksList } from "../hooks/use-quick-checks-list";

type Plan = ReturnType<typeof useQuickChecksList>["plans"][number];

/**
 * Every Quick Check finished, full screen — zoomed out of the Quick Check
 * page's button: under each plan, its Quick Checks, each its passage, day
 * and how many it held. A row opens its results; only the close leaves.
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

  return (
    <ListScreen<Plan>
      testID="quick-checks-screen"
      header={
        <TitleHeader
          title="All Quick Checks"
          actions={
            <HeaderIconButton
              testID="quick-checks-close-button"
              icon={X}
              accessibilityLabel="Close"
              onPress={view.close}
            />
          }
        />
      }
      data={view.loading ? [] : view.plans}
      keyExtractor={(plan) => plan.planId}
      contentStyle={styles.list}
      {...(view.loading && {
        empty: (
          <Skeleton testID="quick-checks-pending" style={{ gap: space[16] }}>
            <SkeletonLines count={3} />
            <SkeletonLines count={3} />
          </Skeleton>
        ),
      })}
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
  list: { gap: space[12], paddingBottom: space[40] },
});
