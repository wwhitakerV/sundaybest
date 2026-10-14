import { View } from "react-native";

/** `ListScreen`'s room between rows, and at a list's ends: nothing at all without a `size`. */
export function ListGap({ testID, size }: { testID: string; size: number | undefined }) {
  return size === undefined ? null : <View testID={`${testID}-gap`} style={{ height: size }} />;
}
