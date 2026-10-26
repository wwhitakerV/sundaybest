import { useState } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import { GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import { ArrowLeft } from "lucide-react-native";

import { space, useTheme } from "@/theme";
import { HeaderIconButton } from "@/ui/atoms/HeaderIconButton";
import { ScreenHeader } from "@/ui/molecules/ScreenHeader";
import { useFrameClearance } from "@/ui/organisms/ScrollFrame";
import { ScrollScreen } from "@/ui/organisms/ScrollScreen";
import { PAGE_INSET } from "@/ui/organisms/Screen";
import { useHideTabBar } from "@/ui/organisms/tab-bar/tab-bar-accessory";
import { useTrackMotion } from "../hooks/use-track-motion";
import { IDEAL_OBJECTS } from "../logic/formation-ideal";
import { FormationTrackBoard } from "./FormationTrackBoard";
import { IdealHeader } from "./IdealHeader";
import { TrackText } from "./TrackText";
import { TrackTicker } from "./TrackTicker";

/** The room between the heading and the board. */
const STAGE_GAP = space[8];
/** The ticker's width: its marker's length. */
const TICKER_WIDTH = 16;

/** The page under the header: the title, then the track, its words and ticker beside the station in hand. */
function TrackPage({ title, width }: { title: string | null; width: number }) {
  const { colors } = useTheme();
  const clearance = useFrameClearance();
  const motion = useTrackMotion(width);
  const [page, setPage] = useState({ height: 0, stageY: 0 });
  const first = IDEAL_OBJECTS[0]!;
  // The words run from the inset to just short of the object in hand.
  const wordsWidth =
    (first.x - first.d / 2) * width - PAGE_INSET - TICKER_WIDTH - space[12] - space[16];

  return (
    <GestureHandlerRootView style={styles.fill}>
      <GestureDetector gesture={motion.gesture}>
        <View
          style={styles.fill}
          onLayout={(event) =>
            setPage((current) => ({ ...current, height: event.nativeEvent.layout.height }))
          }
        >
          {/* Behind everything, up under the header and down to the screen's foot. */}
          <View style={[styles.canvas, { top: -clearance.top, left: -PAGE_INSET }]}>
            <FormationTrackBoard
              testID="formation-board"
              width={width}
              height={clearance.top + page.height + clearance.bottom}
              top={clearance.top + page.stageY}
              // The heading runs from the page's top to just above the board.
              heading={{ top: -page.stageY, bottom: -STAGE_GAP }}
              shown={motion.shown}
              drawIn={motion.drawIn}
              accent={colors.accent}
            />
          </View>
          <IdealHeader
            testID="formation-header"
            width={width - PAGE_INSET * 2}
            screenWidth={width}
            title={title}
          />
          <View
            style={styles.stage}
            onLayout={(event) =>
              setPage((current) => ({ ...current, stageY: event.nativeEvent.layout.y }))
            }
          >
            <View style={styles.beside}>
              <TrackTicker testID="formation-ticker" shown={motion.shown} />
              <TrackText testID="formation-words" shown={motion.shown} width={wordsWidth} />
            </View>
          </View>
        </View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
}

export type FormationTrackViewProps = { title: string | null; onBack: () => void };

/**
 * vIdeal 2: vIdeal's board as a track, moved by a finger anywhere on the
 * page — each object riding up into the place the eye starts in, every
 * place's lines morphing into the arriving object's, the words and the
 * ticker beside the one in hand saying which it is. Framed as every pushed page is (Back at
 * the header's left), the tab bar away, on the app's own white page.
 */
export function FormationTrackView({ title, onBack }: FormationTrackViewProps) {
  const { width } = useWindowDimensions();
  useHideTabBar(true);

  return (
    <ScrollScreen
      testID="formation-screen"
      fixed
      header={
        <ScreenHeader
          testID="formation-header-bar"
          title=""
          left={
            <HeaderIconButton
              testID="formation-back-button"
              icon={ArrowLeft}
              accessibilityLabel="Back"
              onPress={onBack}
            />
          }
        />
      }
    >
      <TrackPage title={title} width={width} />
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  canvas: { position: "absolute" },
  stage: { flex: 1, marginTop: STAGE_GAP },
  beside: { flexDirection: "row", gap: space[12], paddingTop: space[8] },
});
