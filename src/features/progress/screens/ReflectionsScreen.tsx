import { StyleSheet, View } from "react-native";
import { Search, X } from "lucide-react-native";

import { space } from "@/theme";
import { HeaderButtonPill } from "@/ui/molecules/HeaderButtonPill";
import { SearchField } from "@/ui/molecules/SearchField";
import { Skeleton } from "@/ui/molecules/Skeleton";
import { SkeletonLines } from "@/ui/molecules/SkeletonLines";
import { TitleHeader } from "@/ui/molecules/TitleHeader";
import { KEYBOARD_BAR_ROOM, KeyboardBar } from "@/ui/organisms/KeyboardBar";
import { ListScreen } from "@/ui/organisms/ListScreen";
import { ScreenLoadError } from "@/ui/organisms/ScreenLoadError";
import { SFProBody } from "@/ui/typography/SFProBody";
import { ReflectionsPlanCard } from "../components/ReflectionsPlanCard";
import { useReflectionsList } from "../hooks/use-reflections-list";

type Plan = ReturnType<typeof useReflectionsList>["plans"][number];

/**
 * Every reflection written on this phone, full screen — zoomed out of Your
 * words' notebook. The search springs in where the notebook was, the close
 * beside it; tapped, it sinks into the page and its field rises on the
 * keyboard, as Plans' does; put away empty, the icon springs back. Under each plan, its
 * reflections, each its question and date; a row opens Your words on it.
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
        <TitleHeader
          title="All reflections"
          actions={
            // Two buttons side by side share one pill; the search sinks into the page when it opens.
            <HeaderButtonPill
              testID="reflections-header-buttons"
              buttons={[
                {
                  key: "search",
                  testID: "reflections-search-button",
                  icon: Search,
                  accessibilityLabel: "Search your reflections",
                  onPress: view.openSearch,
                  sunk: view.searching,
                },
                {
                  key: "close",
                  testID: "reflections-close-button",
                  icon: X,
                  accessibilityLabel: "Close",
                  onPress: view.close,
                },
              ]}
            />
          }
        />
      }
      {...(view.searching && {
        overlay: (
          // Plans' own field, on the keyboard, the full width.
          <KeyboardBar testID="reflections-search-bar">
            <View style={styles.field}>
              <SearchField
                testID="reflections-search"
                accessibilityLabel="Search your reflections"
                placeholder="Search anything"
                value={view.search}
                onChange={view.setSearch}
                onBlur={view.leaveSearch}
                autoFocus
                raised
              />
            </View>
          </KeyboardBar>
        ),
      })}
      data={view.loading ? [] : view.plans}
      keyExtractor={(plan) => plan.planId}
      // With the search open, the last plan ends clear of its bar.
      contentStyle={[
        styles.list,
        view.searching && { paddingBottom: space[40] + KEYBOARD_BAR_ROOM },
      ]}
      {...(empty && { empty })}
      renderItem={({ item }) => (
        <ReflectionsPlanCard title={item.title} rows={item.rows} onOpen={view.open} />
      )}
    />
  );
}

const styles = StyleSheet.create({
  field: { flex: 1 },
  list: { gap: space[12], paddingBottom: space[40] },
});
