import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { radius, space } from "@/theme";
import { VideoThumbnail } from "@/ui/atoms/VideoThumbnail";
import { BottomSheet } from "@/ui/organisms/BottomSheet";
import { SFProBody } from "@/ui/typography/SFProBody";

/** A sermon's artwork in the list, 16:9. */
const ARTWORK_WIDTH = 112;
/** The sheet shows this many of ours at once; more scroll under them. */
const ROWS_SHOWN = 3;
/** A row's height: its 16:9 artwork, which its two lines of words sit beside. */
const ROW_HEIGHT = (ARTWORK_WIDTH * 9) / 16;
const ROW_GAP = space[20];
/** The list held to three rows and the room under the last. */
const LIST_HEIGHT = ROWS_SHOWN * ROW_HEIGHT + (ROWS_SHOWN - 1) * ROW_GAP + space[24];
const ARTWORK_RADIUS = radius[12];

export type SamplePlan = { id: string; title: string; thumbnailUrl: string | null; detail: string };

export type SamplePlansSheetProps = {
  visible: boolean;
  samples: readonly SamplePlan[];
  onPick: (planId: string) => void;
  onClose: () => void;
  testID: string;
};

/**
 * Our ready-made plans, to try before adding a sermon of one's own: a sheet
 * as tall as three of them — more scroll under — each sermon its artwork,
 * title, church and length. A tap opens that plan.
 */
export function SamplePlansSheet({
  visible,
  samples,
  onPick,
  onClose,
  testID,
}: SamplePlansSheetProps) {
  return (
    <BottomSheet
      testID={testID}
      visible={visible}
      onClose={onClose}
      accessibilityLabel="Try one of ours"
      fit
    >
      <ScrollView style={styles.scroll} contentContainerStyle={styles.list}>
        {samples.map((sample) => (
          <Pressable
            key={sample.id}
            testID={`${testID}-${sample.id}`}
            accessibilityRole="button"
            accessibilityLabel={`${sample.title}, ${sample.detail}`}
            onPress={() => onPick(sample.id)}
            style={styles.row}
          >
            <VideoThumbnail uri={sample.thumbnailUrl} style={styles.artwork} />
            <View style={styles.words}>
              <SFProBody numberOfLines={2}>{sample.title}</SFProBody>
              <SFProBody variant="detail" tone="textSupporting" numberOfLines={1}>
                {sample.detail}
              </SFProBody>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  scroll: { maxHeight: LIST_HEIGHT, flexGrow: 0 },
  list: { gap: ROW_GAP, paddingBottom: space[24] },
  row: { flexDirection: "row", alignItems: "center", gap: space[16] },
  artwork: { width: ARTWORK_WIDTH, borderRadius: ARTWORK_RADIUS },
  words: { flex: 1, gap: space[4] },
});
