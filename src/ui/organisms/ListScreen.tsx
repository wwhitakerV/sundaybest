import { type ReactElement, type ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { FlashList, type ListRenderItem } from "@shopify/flash-list";

import { ListGap } from "./ListGap";
import { PinnedList } from "./PinnedList";
import { SCROLL_INSET, ScrollFrame, useFrameClearance, type ScrollFrameProps } from "./ScrollFrame";
import { scrollProps } from "./list-scroll";

export type ListScreenProps<Item> = Omit<ScrollFrameProps, "children"> & {
  data: readonly Item[];
  renderItem: ListRenderItem<Item>;
  keyExtractor: (item: Item) => string;
  /** A row's kind, when the list holds more than one (Weeks' months and weeks): a row is reused only for one like it. */
  itemType?: (item: Item) => string;
  /** Shown in place of the list when it's empty. */
  empty?: ReactElement;
  /** Between rows, and between the first and last and the list's ends. */
  gap?: number;
  /** Layout extras for the list's content (room at its foot). Never its sides, nor its gap. */
  contentStyle?: StyleProp<ViewStyle>;
  /**
   * In place of a floating header: a `bar` (Plans' header) pinned above the
   * list, under the status bar, on the page's own solid colour — no fade,
   * nothing showing behind it.
   */
  pinned?: {
    bar: ReactNode;
    /**
     * The list's top rounds into the bar along this radius (the cards'), as
     * through a window, rather than being cut straight (Plans).
     */
    rounded?: number;
  };
  /** How far down it's scrolled, as it scrolls — for a header that changes with it (Plans'). */
  onScroll?: (y: number) => void;
  /** Dragging the list puts the keyboard away (`on-drag`), for a list with a field on the keyboard. */
  keyboardDismissMode?: "none" | "on-drag" | "interactive";
};

/**
 * `ScrollScreen` for a list of items, on FlashList: only the rows in view
 * are drawn, and they're reused as the list scrolls, however long it grows —
 * so a row never keeps state of its own (`useRecyclingState` where it must),
 * and its artwork is keyed to its image (`recyclingKey`). The list runs the
 * screen's full width, the page inset on its content and on the header and
 * footer (`ScrollFrame`).
 */
export function ListScreen<Item>({
  data,
  renderItem,
  keyExtractor,
  itemType,
  empty,
  gap,
  contentStyle,
  pinned,
  onScroll,
  keyboardDismissMode,
  ...frame
}: ListScreenProps<Item>) {
  const list = {
    ...(itemType && { itemType }),
    ...(keyboardDismissMode && { keyboardDismissMode }),
    ...(onScroll && { onScroll }),
    ...(gap !== undefined && { gap }),
    testID: `${frame.testID}-list`,
    data,
    renderItem,
    keyExtractor,
    ...(empty && { empty }),
    ...(contentStyle && { contentStyle }),
  };

  if (pinned) {
    return (
      <ScrollFrame {...frame} topEdge="none">
        <PinnedList {...list} pinned={pinned} />
      </ScrollFrame>
    );
  }
  return (
    <ScrollFrame {...frame}>
      <ClearedList {...list} />
    </ScrollFrame>
  );
}

/** What `ListScreen` hands the list it draws. */
export type ListParts<Item> = Pick<
  ListScreenProps<Item>,
  | "data"
  | "renderItem"
  | "keyExtractor"
  | "itemType"
  | "empty"
  | "gap"
  | "contentStyle"
  | "onScroll"
  | "keyboardDismissMode"
> & { testID: string };

/** The list itself, its items resting clear of the frame's header, dock, and fades. */
function ClearedList<Item>({
  testID,
  data,
  renderItem,
  keyExtractor,
  itemType,
  empty,
  gap,
  contentStyle,
  onScroll,
  keyboardDismissMode,
}: ListParts<Item>) {
  const clearance = useFrameClearance();

  return (
    <FlashList
      testID={testID}
      {...scrollProps(onScroll)}
      {...(keyboardDismissMode && { keyboardDismissMode })}
      style={styles.list}
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      {...(itemType && { getItemType: itemType })}
      contentContainerStyle={[SCROLL_INSET, contentStyle]}
      showsVerticalScrollIndicator={false}
      {...(empty && { ListEmptyComponent: empty })}
      ItemSeparatorComponent={() => <ListGap testID={testID} size={gap} />}
      ListHeaderComponent={
        <>
          <View testID={`${testID}-top-clearance`} style={{ height: clearance.top }} />
          <ListGap testID={testID} size={gap} />
        </>
      }
      ListFooterComponent={
        <>
          <ListGap testID={testID} size={gap} />
          <View testID={`${testID}-bottom-clearance`} style={{ height: clearance.bottom }} />
        </>
      }
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
});
