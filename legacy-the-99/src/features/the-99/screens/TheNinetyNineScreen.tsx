import { useState } from "react";
import { StyleSheet, View, type LayoutChangeEvent } from "react-native";
import { useRouter } from "expo-router";
import { GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RotateCcw, X } from "lucide-react-native";

import { BOARD, FlockBoard } from "@/entities/flock";
import { space, useTheme } from "@/theme";
import { HeaderIconButton } from "@/ui/atoms/HeaderIconButton";
import { PAGE_INSET } from "@/ui/organisms/Screen";
import { MonoLabel } from "@/ui/typography/MonoLabel";
import { GameFoot } from "../components/GameFoot";
import { GameResult } from "../components/GameResult";
import { ScoreTally } from "../components/ScoreTally";
import { useFlockGame } from "../hooks/use-flock-game";

/** What each part of the game asks, under the board — none once it's over. */
const HINTS = {
  gate: "Slide the gate along the line, then let go. It stays there.",
  countdown: "The wolf is coming.",
  play: "Tap to call the flock. Hold to call louder. The wolf won't come near the gate.",
  over: null,
};
/** Once it's over, the board stays, stilled and faint, under how it went. */
const STILLED = 0.2;

/** The widest board that fits the room it's given, its shape kept. */
function fitBoard(room: { width: number; height: number }): number {
  return Math.floor(Math.min(room.width, (room.height * BOARD.width) / BOARD.height));
}

/**
 * The 99, full screen on white, fitting it — it never scrolls: close at the
 * top with the game's name and today's number; the saved, those still in
 * the field and the lost (`ScoreTally`); the board as large as the room
 * allows, under the reader's finger (`FlockBoard`, `useFlockGame`), the
 * countdown inside the wolf; and under it what to do — or, once every sheep
 * is home or gone, how it went over the stilled board, with Share and Done.
 * Today's flock, once played, shows its result.
 */
export function TheNinetyNineScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [room, setRoom] = useState({ width: 0, height: 0 });
  const boardWidth = fitBoard(room);
  const play = useFlockGame(boardWidth);
  const over = play.phase === "over";

  return (
    <GestureHandlerRootView
      testID="the-99-screen"
      style={[
        styles.page,
        {
          backgroundColor: theme.colors.background,
          paddingTop: insets.top,
          paddingBottom: insets.bottom + space[16],
        },
      ]}
    >
      <View style={styles.header}>
        <HeaderIconButton
          testID="the-99-close"
          icon={X}
          accessibilityLabel="Close"
          onPress={() => router.back()}
        />
        <MonoLabel variant="labelTracked" accessibilityRole="header">
          THE 99
        </MonoLabel>
        {play.restart ? (
          // Development builds: play today's flock again, as often as wanted.
          <HeaderIconButton
            testID="the-99-restart"
            icon={RotateCcw}
            accessibilityLabel="Play again"
            onPress={() => void play.restart?.()}
          />
        ) : (
          <MonoLabel variant="labelTracked" tone="textSupporting" style={styles.daily}>
            {play.daily}
          </MonoLabel>
        )}
      </View>

      <ScoreTally saved={play.saved} left={play.left} lost={play.lost} />

      <View
        style={styles.stage}
        onLayout={(event: LayoutChangeEvent) => setRoom(event.nativeEvent.layout)}
      >
        {boardWidth > 0 && (
          <GestureDetector gesture={play.touch}>
            <View collapsable={false} style={over && styles.stilled}>
              <FlockBoard testID="the-99-board" game={play.game} width={boardWidth} />
            </View>
          </GestureDetector>
        )}
        {play.result && (
          <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.result]}>
            <GameResult result={play.result} />
          </View>
        )}
      </View>

      <GameFoot
        hint={HINTS[play.phase]}
        onShare={play.share}
        onDone={() => router.back()}
      />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, paddingHorizontal: PAGE_INSET, gap: space[16] },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: space[12],
  },
  // The day, opposite close: the name sits between them.
  daily: { minWidth: space[40], textAlign: "right" },
  // The board takes what the rest leaves, centred in it.
  stage: { flex: 1, alignItems: "center", justifyContent: "center" },
  stilled: { opacity: STILLED },
  result: { alignItems: "center", justifyContent: "center" },
});
