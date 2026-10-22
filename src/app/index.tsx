import { Redirect } from "expo-router";

/**
 * The launch lands on Home, for every reader: Home itself decides whether
 * they're new (no plan of their own) and welcomes them if so.
 */
export default function IndexScreen() {
  return <Redirect href="/(tabs)/home" />;
}
