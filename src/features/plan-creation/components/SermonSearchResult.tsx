import { Pressable, StyleSheet, View } from "react-native";

import { radius, space, useTheme } from "@/theme";
import { VideoThumbnail } from "@/ui/atoms/VideoThumbnail";
import { SFProBody } from "@/ui/typography/SFProBody";
import { SFProTitle } from "@/ui/typography/SFProTitle";
import { formatDuration } from "@/utils/time/formatDuration";
import type { SermonSearchResult as SermonSearchResultData } from "../data/search-sermons";

const SELECTED_BORDER = 2.5;

export type SermonSearchResultProps = {
  result: SermonSearchResultData;
  selected: boolean;
  onPress: () => void;
  testID: string;
};

/** One sermon choice. A press selects it; it never advances the plan flow. */
export function SermonSearchResult({ result, selected, onPress, testID }: SermonSearchResultProps) {
  const theme = useTheme();
  const { sermon } = result;

  return (
    <Pressable
      testID={testID}
      accessibilityRole="radio"
      accessibilityLabel={`${sermon.title}${sermon.church ? `, ${sermon.church}` : ""}`}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: pressed ? theme.colors.segmentBackground : theme.colors.surface,
          borderColor: selected ? theme.colors.text : theme.colors.divider,
          borderWidth: selected ? 2 : 1,
        },
      ]}
    >
      <VideoThumbnail
        uri={sermon.thumbnailUrl}
        duration={formatDuration(sermon.durationSeconds)}
        style={styles.thumbnail}
      />
      <View style={styles.copy}>
        <SFProTitle variant="card" numberOfLines={2}>
          {sermon.title}
        </SFProTitle>
        {sermon.church && (
          <SFProBody variant="detail" tone="textMuted" numberOfLines={1}>
            {sermon.church}
          </SFProBody>
        )}
      </View>
      {selected && (
        <View
          pointerEvents="none"
          testID={`${testID}-outline`}
          style={[styles.selectedOutline, { borderColor: theme.colors.text }]}
        />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    position: "relative",
    minHeight: 92,
    flexDirection: "row",
    alignItems: "center",
    gap: space[12],
    padding: space[8],
    borderRadius: radius[16],
    borderWidth: 1,
    overflow: "hidden",
  },
  thumbnail: { width: 116, borderRadius: radius[14] },
  copy: { flex: 1, gap: space[4], paddingRight: space[4] },
});
