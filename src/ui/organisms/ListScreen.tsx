import type { ReactElement } from "react";
import {
  FlatList,
  StyleSheet,
  type ListRenderItem,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { SCROLL_INSET, ScrollFrame, type ScrollFrameProps } from "./ScrollFrame";

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
      <FlatList
        testID={`${frame.testID}-list`}
        style={styles.list}
        data={data}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={[SCROLL_INSET, contentStyle]}
        showsVerticalScrollIndicator={false}
        {...(empty && { ListEmptyComponent: empty })}
      />
    </ScrollFrame>
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
});
