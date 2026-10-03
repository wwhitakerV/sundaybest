import { StyleSheet, View } from "react-native";

import { space } from "@/theme";
import { SFProBody } from "@/ui/typography/SFProBody";
import type { SermonSearchResult as SermonSearchResultData } from "../data/search-sermons";
import { SERMON_SEARCH_MIN_CHARACTERS, type SermonSearchStatus } from "../logic/sermon-search";
import { SermonSearchResult } from "./SermonSearchResult";

export type SermonSearchResultsProps = {
  query: string;
  results: readonly SermonSearchResultData[];
  status: SermonSearchStatus;
  selectedId: string | null;
  onSelect: (result: SermonSearchResultData) => void;
  testID: string;
};

/** Nothing until there's a query; then guidance, request state, an empty result, or the matching sermons. */
export function SermonSearchResults({
  query,
  results,
  status,
  selectedId,
  onSelect,
  testID,
}: SermonSearchResultsProps) {
  const trimmed = query.trim();

  // The page's own line above the field already says what to search by.
  if (trimmed.length === 0) return null;

  if (trimmed.length < SERMON_SEARCH_MIN_CHARACTERS) {
    return (
      <SFProBody testID={`${testID}-hint`} tone="textMuted" style={styles.message}>
        Keep typing to search.
      </SFProBody>
    );
  }

  // During the 400ms debounce (and while a request is active), never show a
  // false "No sermons found" state from an older or not-yet-run query.
  if (status === "waiting" || status === "searching") return null;

  if (status === "error") {
    return (
      <View testID={`${testID}-error`} style={styles.empty}>
        <SFProBody variant="listItem">Search unavailable</SFProBody>
        <SFProBody tone="textMuted">Try again in a moment.</SFProBody>
      </View>
    );
  }

  if (status === "ready" && results.length === 0) {
    return (
      <View testID={`${testID}-empty`} style={styles.empty}>
        <SFProBody variant="listItem">No sermons found</SFProBody>
        <SFProBody tone="textMuted">Try a different pastor, church, or title.</SFProBody>
      </View>
    );
  }

  return (
    <View testID={testID} accessibilityRole="radiogroup" style={styles.results}>
      {results.map((result) => (
        <SermonSearchResult
          key={result.id}
          testID={`${testID}-${result.id}`}
          result={result}
          selected={selectedId === result.id}
          onPress={() => onSelect(result)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  message: { marginTop: space[4], marginLeft: space[6] },
  empty: { gap: space[4], paddingTop: space[8], paddingHorizontal: space[6] },
  results: { marginTop: space[4], gap: space[10] },
});
