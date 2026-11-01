import { useRef } from "react";
import { View } from "react-native";
import { useSharedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Search } from "lucide-react-native";

import { FEATURE_ARTWORK_RADIUS } from "@/entities/plan";
import { space } from "@/theme";
import { HeaderIconButton } from "@/ui/atoms/HeaderIconButton";
import { TitleHeader } from "@/ui/molecules/TitleHeader";
import { getFootAboveTabBar } from "@/ui/organisms/frame-edges";
import { ListScreen } from "@/ui/organisms/ListScreen";
import { ScreenLoadError } from "@/ui/organisms/ScreenLoadError";
import { LibraryRowView } from "../components/LibraryRowView";
import { LibrarySkeleton } from "../components/LibrarySkeleton";
import { usePlanLibrary } from "../hooks/use-plan-library";
import { libraryRowKey, type LibraryRow } from "../logic/library-rows";

/** Between the list's rows, and at its ends: close, each row bringing the room it needs below it. */
const LIST_GAP = space[8];
/** Where the colophon ends: this far above the floating tab bar, as every Settings page's last line does. */
const TAB_BAR_GAP = space[24];

/**
 * The Plans tab: the reader's library, read down one column, as a
 * publication's contents are. Under one fixed header — "Plans", and from two
 * plans the search — the shelves (My studies; Done, once a plan's finished),
 * then on My studies the plan opened last, featured, and under their head
 * the rest, each its artwork, folio, title, church and days; on Done the
 * plans finished. Its foot, the library's colophon. Loading, the lead's
 * shape; with no plans, what fills it.
 */
export function PlansScreen() {
  const view = usePlanLibrary();
  const scrolled = useSharedValue(0);
  // Where the header ends down the screen: the lead's Continue hands over once it's under it.
  const bar = useRef<View>(null);
  const headerFoot = useSharedValue(0);
  // The list's own end gap counts toward the room above the tab bar.
  const foot = getFootAboveTabBar(useSafeAreaInsets().bottom, TAB_BAR_GAP) - LIST_GAP;

  if (view.error) {
    return (
      <ScreenLoadError testID="plans-load-error" title="Couldn't load Plans" onRetry={view.retry} />
    );
  }

  return (
    <ListScreen<LibraryRow>
      testID="plans-screen"
      pinned={{
        bar: (
          <View
            ref={bar}
            testID="plans-header"
            onLayout={() =>
              bar.current?.measureInWindow((_x, top, _width, height) =>
                headerFoot.set(top + height),
              )
            }
          >
            <TitleHeader
              title="Plans"
              actions={
                view.searchable && (
                  <HeaderIconButton
                    testID="plans-search-button"
                    icon={Search}
                    accessibilityLabel="Search plans"
                    onPress={view.openSearch}
                  />
                )
              }
            />
          </View>
        ),
        rounded: FEATURE_ARTWORK_RADIUS,
      }}
      data={view.loading ? [] : view.rows}
      keyExtractor={libraryRowKey}
      itemType={(row) => row.kind}
      gap={LIST_GAP}
      contentStyle={{ paddingBottom: foot }}
      onScroll={(y) => scrolled.set(y)}
      empty={<LibrarySkeleton testID="plans-content-pending" />}
      renderItem={({ item }) => (
        <LibraryRowView
          row={item}
          shelf={view.shelf}
          onPickShelf={view.pickShelf}
          scrolled={scrolled}
          headerFoot={headerFoot}
        />
      )}
    />
  );
}
