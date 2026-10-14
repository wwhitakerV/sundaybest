import { Search, X } from "lucide-react-native";

import { HeaderIconButton } from "@/ui/atoms/HeaderIconButton";
import { HeaderButtonPill } from "@/ui/molecules/HeaderButtonPill";
import { TitleHeader } from "@/ui/molecules/TitleHeader";

export type ListSearchHeaderProps = {
  /** Prefixes its buttons' ids: `<testID>-search-button`, `<testID>-close-button`. */
  testID: string;
  title: string;
  /** The list is long enough to have earned search (`isSearchEarned`). */
  searchable: boolean;
  /** The search is open, its field on the keyboard (`ListSearchBar`). */
  searching: boolean;
  /** The search button's name to VoiceOver: "Search your reflections". */
  searchLabel: string;
  onSearch: () => void;
  onClose: () => void;
};

/**
 * A full-screen list's header: its large title, and its close — with search
 * beside it in one pill once the list has earned it. Tapped, the search
 * fades where it is and, just after, the whole pill fades while the field
 * rises on the keyboard with its own close; closed, both fade back.
 */
export function ListSearchHeader({
  testID,
  title,
  searchable,
  searching,
  searchLabel,
  onSearch,
  onClose,
}: ListSearchHeaderProps) {
  const close = {
    testID: `${testID}-close-button`,
    icon: X,
    accessibilityLabel: "Close",
    onPress: onClose,
  };

  return (
    <TitleHeader
      title={title}
      actions={
        searchable ? (
          <HeaderButtonPill
            testID={`${testID}-header-buttons`}
            gone={searching}
            buttons={[
              {
                key: "search",
                testID: `${testID}-search-button`,
                icon: Search,
                accessibilityLabel: searchLabel,
                onPress: onSearch,
                sunk: searching,
              },
              { key: "close", ...close },
            ]}
          />
        ) : (
          <HeaderIconButton {...close} />
        )
      }
    />
  );
}
