import type { ReactElement } from "react";
import {
  FlatList,
  StyleSheet,
  View,
  type ListRenderItem,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { SCROLL_INSET, ScrollFrame, useFrameClearance, type ScrollFrameProps } from "./ScrollFrame";

export type ListScreenProps<Item> = Omit<ScrollFrameProps, "children"> & {
  data: readonly Item[];
  renderItem: ListRenderItem<Item>;
  keyExtractor: (item: Item) => string;
  /** Shown in place of the list when it's empty. */
  empty?: ReactElement;
  /** Layout extras for the list's content (gaps, room at its foot). Never its sides. */
  contentStyle?: StyleProp<ViewStyle>;
};

/**
 * `ScrollScreen` for a list of items, drawn as they scroll into view: the
 * list runs the screen's full width, the page inset on its content and on
 * the header and footer (`ScrollFrame`).
 */
export function ListScreen<Item>({
  data,
  renderItem,
  keyExtractor,
  empty,
  contentStyle,
  ...frame
}: ListScreenProps<Item>) {
  return (
    <ScrollFrame {...frame}>
      <ClearedList
        testID={`${frame.testID}-list`}
        data={data}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        {...(empty && { empty })}
        {...(contentStyle && { contentStyle })}
      />
    </ScrollFrame>
  );
}

/** The list itself, its items resting clear of the frame's header, dock, and fades. */
function ClearedList<Item>({
  testID,
  data,
  renderItem,
  keyExtractor,
  empty,
  contentStyle,
}: Pick<
  ListScreenProps<Item>,
  "data" | "renderItem" | "keyExtractor" | "empty" | "contentStyle"
> & {
  testID: string;
}) {
  const clearance = useFrameClearance();

  return (
    <FlatList
      testID={testID}
      style={styles.list}
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      contentContainerStyle={[SCROLL_INSET, contentStyle]}
      showsVerticalScrollIndicator={false}
      {...(empty && { ListEmptyComponent: empty })}
      ListHeaderComponent={
        <View testID={`${testID}-top-clearance`} style={{ height: clearance.top }} />
      }
      ListFooterComponent={
        <View testID={`${testID}-bottom-clearance`} style={{ height: clearance.bottom }} />
      }
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
});
