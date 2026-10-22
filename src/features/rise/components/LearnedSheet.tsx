import { useRef, useState } from "react";
import { ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useReduceMotion } from "@/core/accessibility/use-reduce-motion";
import { selectionFeedback } from "@/core/haptics/haptics";
import { space, useTheme } from "@/theme";
import { BottomSheet } from "@/ui/organisms/BottomSheet";
import { MonoLabel } from "@/ui/typography/MonoLabel";
import type { LearnedRow } from "../logic/describe-rise";
import { LearnedDots } from "./LearnedDots";
import { LearnedPage } from "./LearnedPage";

/** Three-quarters of the screen, the same on every page. */
const SHEET_HEIGHT = 0.75;

export type LearnedSheetProps = {
  visible: boolean;
  rows: LearnedRow[];
  onClose: () => void;
};

/**
 * What the day's six taught, a page each, swiped through, in three-quarters
 * of the screen: its title at the top left and where you are ("03 / 06")
 * opposite; at its foot, in a band of its own under a hairline, a small
 * balloon or burst for each — a slider's dots — tapped to go to it. A page plays as it's
 * arrived at — its mark alive, its words fading in — every time; a tick as
 * each is reached. Opened, it starts at the first.
 */
export function LearnedSheet({ visible, rows, onClose }: LearnedSheetProps) {
  const { width } = useWindowDimensions();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const still = useReduceMotion();
  const pager = useRef<ScrollView>(null);
  const [place, setPlace] = useState({ page: 0, visit: 0 });
  const [pageHeight, setPageHeight] = useState(0);
  const [openFor, setOpenFor] = useState(visible);
  // Opened again: back to the first page, played afresh.
  if (visible !== openFor) {
    setOpenFor(visible);
    if (visible) setPlace((current) => ({ page: 0, visit: current.visit + 1 }));
  }

  function arrive(page: number) {
    if (page === place.page || page < 0 || page >= rows.length) return;
    selectionFeedback();
    setPlace((current) => ({ page, visit: current.visit + 1 }));
  }

  return (
    <BottomSheet
      testID="rise-learned-sheet"
      visible={visible}
      onClose={onClose}
      accessibilityLabel="What you learned"
      heightRatio={SHEET_HEIGHT}
      titleStyle="editorial"
      titleAccessory={
        <MonoLabel variant="labelTracked" tone="textSupporting" testID="rise-learned-page">
          {`${String(place.page + 1).padStart(2, "0")} / ${String(rows.length).padStart(2, "0")}`}
        </MonoLabel>
      }
    >
      <ScrollView
        ref={pager}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        style={styles.pager}
        onLayout={(event) => setPageHeight(event.nativeEvent.layout.height)}
        contentOffset={{ x: place.page * width, y: 0 }}
        onMomentumScrollEnd={(event) =>
          arrive(Math.round(event.nativeEvent.contentOffset.x / width))
        }
      >
        {rows.map((row, index) => (
          // Each page given the pager's own height: a horizontal pager doesn't stretch its pages.
          <View key={row.id} style={{ width, height: pageHeight }}>
            {index === place.page && pageHeight > 0 && (
              <LearnedPage key={place.visit} row={row} still={still} />
            )}
          </View>
        ))}
      </ScrollView>
      {/* The navigation: its own band, under a hairline, still while the pages slide above it. */}
      <View
        style={[
          styles.navigation,
          { borderTopColor: colors.divider, paddingBottom: insets.bottom + space[24] },
        ]}
      >
        <LearnedDots
          rows={rows}
          page={place.page}
          onPick={(page) => {
            pager.current?.scrollTo({ x: page * width, animated: true });
            arrive(page);
          }}
        />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  // The pages run out to the sheet's sides (its own inset, space[24]), and down to the hairline —
  // the sheet's gap above the navigation taken back — so the hairline is the pages' floor.
  pager: { flex: 1, marginHorizontal: -space[24], marginBottom: -space[24] },
  // Edge to edge and down past the sheet's own foot inset (space[40]), to the screen's foot.
  navigation: {
    marginHorizontal: -space[24],
    marginBottom: -space[40],
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: space[24],
    alignItems: "center",
  },
});
