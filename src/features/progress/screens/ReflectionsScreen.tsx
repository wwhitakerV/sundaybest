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
import { useReflectionsList } from "../hooks/use-reflections-list";

type Plan = ReturnType<typeof useReflectionsList>["plans"][number];

/**
 * Every reflection written on this phone, full screen — zoomed out of Your
 * words' notebook. From two, a search springs in beside the close
 * (`ListSearchHeader`); tapped, it fades and its field rises on
 * the keyboard (`ListSearchBar`). Under each plan, its reflections, each its
 * question and date; a row opens Your words on it.
 */
export function ReflectionsScreen() {
  const view = useReflectionsList();

  if (view.error) {
    return (
      <ScreenLoadError
        testID="reflections-load-error"
        title="Couldn't load your reflections"
        onRetry={view.retry}
        leave={{ label: "Close", onPress: view.close }}
      />
    );
  }

  const empty = view.loading ? (
    <Skeleton testID="reflections-pending" style={{ gap: space[16] }}>
      <SkeletonLines count={3} />
      <SkeletonLines count={3} />
    </Skeleton>
  ) : view.noMatch ? (
    <SFProBody variant="reading" tone="textInactive" testID="reflections-no-match">
      {`Nothing matches “${view.noMatch}”.`}
    </SFProBody>
  ) : null;

  return (
    <ListScreen<Plan>
      testID="reflections-screen"
      // A swipe down with the keyboard up only puts the keyboard away.
      keyboardDismissMode="on-drag"
      header={
        <ListSearchHeader
          testID="reflections"
          title="All reflections"
          searchable={view.searchable}
          searching={view.searching}
          searchLabel="Search your reflections"
          onSearch={view.openSearch}
          onClose={view.close}
        />
      }
      {...(view.searching && {
        overlay: (
          <ListSearchBar
            testID="reflections"
            label="Search your reflections"
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
          testID="reflections-row"
          title={item.title}
          thumbnailUrl={item.thumbnailUrl}
          rows={item.rows.map((row) => ({ id: row.id, title: row.question, detail: row.date }))}
          onOpen={view.open}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: space[40] },
});
