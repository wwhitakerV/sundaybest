import { useContext } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";
import { X } from "lucide-react-native";

import { space } from "@/theme";
import { HeaderIconButton } from "@/ui/atoms/HeaderIconButton";
import { SearchField } from "@/ui/molecules/SearchField";
import { Screen } from "@/ui/organisms/Screen";
import { PlanSearchResults } from "../components/PlanSearchResults";
import { useKeyboardOverlap } from "../hooks/use-keyboard-overlap";
import { usePlanSearch } from "../hooks/use-plan-search";

/**
 * Plans' search, full screen, faded in over Plans with the keyboard up: the
 * plans found fill the page from the top, and the field sits on the
 * keyboard, the close beside it — at the foot of the screen once the
 * keyboard is put away. A row opens its plan.
 */
export function PlanSearchScreen() {
  const view = usePlanSearch();
  const insetBottom = useContext(SafeAreaInsetsContext)?.bottom ?? 0;
  // On the keyboard, a gap above its keys; with it away, clear of the home indicator.
  const keyboard = useKeyboardOverlap();
  const barFoot = (keyboard > 0 ? keyboard : insetBottom) + space[8];

  return (
    <Screen testID="plan-search-screen" edges={["top", "left", "right"]}>
      <View style={styles.fill}>
        <ScrollView
          testID="plan-search-results"
          style={styles.fill}
          contentContainerStyle={[styles.content, { paddingVertical: space[12] }]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <PlanSearchResults
            status={view.status}
            rows={view.rows}
            noMatch={view.noMatch}
            onOpen={view.open}
            onRetry={view.retry}
          />
        </ScrollView>
        <View
          style={[
            styles.bar,
            {
              gap: space[10],
              // Close to the screen's edges, as iOS's own search bar on the keyboard.
              paddingHorizontal: space[8],
              paddingTop: space[8],
              paddingBottom: barFoot,
            },
          ]}
        >
          <View style={styles.fill}>
            <SearchField
              testID="plan-search-field"
              accessibilityLabel="Search your plans"
              placeholder="Search your plans"
              value={view.words}
              onChange={view.setWords}
              autoFocus
              raised
            />
          </View>
          <HeaderIconButton
            testID="plan-search-close"
            icon={X}
            accessibilityLabel="Close search"
            raised
            onPress={view.close}
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  // At least the page's height, so a message can sit in its middle.
  content: { flexGrow: 1 },
  bar: { flexDirection: "row", alignItems: "center" },
});
