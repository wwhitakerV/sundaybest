import { useContext } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";
import { X } from "lucide-react-native";

import { space } from "@/theme";
import { HeaderIconButton } from "@/ui/atoms/HeaderIconButton";
import { SearchField } from "@/ui/molecules/SearchField";
import { KEYBOARD_BAR_ROOM, KeyboardBar } from "@/ui/organisms/KeyboardBar";
import { Screen } from "@/ui/organisms/Screen";
import { PlanSearchResults } from "../components/PlanSearchResults";
import { useKeyboardOverlap } from "@/hooks/use-keyboard-overlap";
import { usePlanSearch } from "../hooks/use-plan-search";

/**
 * Plans' search, full screen, faded in over Plans with the keyboard up: the
 * plans found fill the page from the top and run on beneath the field, which
 * sits on the keyboard with the close beside it (`KeyboardBar`) — at the
 * foot of the screen once the keyboard is put away. A row opens its plan.
 */
export function PlanSearchScreen() {
  const view = usePlanSearch();
  const insetBottom = useContext(SafeAreaInsetsContext)?.bottom ?? 0;
  // The results run on beneath the bar; their foot keeps clear of it and of the keyboard,
  // so a message centred in them sits in the room above the bar.
  const keyboard = useKeyboardOverlap();
  const foot = (keyboard > 0 ? keyboard : insetBottom) + KEYBOARD_BAR_ROOM;

  return (
    <Screen testID="plan-search-screen" edges={["top", "left", "right"]}>
      <ScrollView
        testID="plan-search-results"
        style={styles.fill}
        contentContainerStyle={[styles.content, { paddingTop: space[12], paddingBottom: foot }]}
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
      <KeyboardBar testID="plan-search-bar">
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
      </KeyboardBar>
    </Screen>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  // At least the page's height, so a message can sit in its middle.
  content: { flexGrow: 1 },
});
