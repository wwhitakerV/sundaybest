import { StyleSheet, View } from "react-native";
import { X } from "lucide-react-native";

import { HeaderIconButton } from "@/ui/atoms/HeaderIconButton";
import { SearchField } from "@/ui/molecules/SearchField";
import { KeyboardBar } from "./KeyboardBar";

export type ListSearchBarProps = {
  /** Prefixes its parts' ids: `<testID>-search-bar`, `<testID>-search`, `<testID>-search-close`. */
  testID: string;
  /** The field's name to VoiceOver: "Search your reflections". */
  label: string;
  words: string;
  onChange: (words: string) => void;
  /** The keyboard put away. */
  onLeave: () => void;
  /** Its own X. */
  onClose: () => void;
};

/**
 * A list's search on the keyboard, as Plans' is (`KeyboardBar`): the field
 * the full width, its own close springing in beside it. The page runs on
 * beneath it, so a list under it leaves `KEYBOARD_BAR_ROOM` at its foot.
 */
export function ListSearchBar({
  testID,
  label,
  words,
  onChange,
  onLeave,
  onClose,
}: ListSearchBarProps) {
  return (
    <KeyboardBar testID={`${testID}-search-bar`}>
      <View style={styles.field}>
        <SearchField
          testID={`${testID}-search`}
          accessibilityLabel={label}
          placeholder="Search anything"
          value={words}
          onChange={onChange}
          onBlur={onLeave}
          autoFocus
          raised
        />
      </View>
      <HeaderIconButton
        testID={`${testID}-search-close`}
        icon={X}
        accessibilityLabel="Close search"
        raised
        onPress={onClose}
      />
    </KeyboardBar>
  );
}

const styles = StyleSheet.create({
  field: { flex: 1 },
});
