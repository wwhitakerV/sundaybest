import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RotateCcw, X } from "lucide-react-native";

import { RiseBoard } from "@/entities/rise";
import { space, useTheme } from "@/theme";
import { HeaderIconButton } from "@/ui/atoms/HeaderIconButton";
import { PAGE_INSET } from "@/ui/organisms/Screen";
import { MonoLabel } from "@/ui/typography/MonoLabel";
import { LearnedSheet } from "../components/LearnedSheet";
import { PosterSheet } from "../components/PosterSheet";
import { QuestionLine } from "../components/QuestionLine";
import { RiseFinish } from "../components/RiseFinish";
import { RiseIntro } from "../components/RiseIntro";
import { useRiseGame } from "../hooks/use-rise-game";

/**
 * RISE, full screen on white: close at the top with the game's name and
 * today's number; where the day is and the twist, in small capitals; then
 * the board to the screen's foot — the atmosphere, its line, the question
 * under it, the balloons rising from below (`RiseBoard`, `useRiseGame`).
 * Before it starts, the twist and Start; once over, the board stays as the
 * run left it, the score over its foot, and what was learned a tap away.
 */
export function RiseScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const play = useRiseGame();
  const [learning, setLearning] = useState(false);

  return (
    <GestureHandlerRootView
      testID="rise-screen"
      style={[styles.page, { backgroundColor: colors.background, paddingTop: insets.top }]}
    >
      <View style={styles.header}>
        <HeaderIconButton
          testID="rise-close"
          icon={X}
          accessibilityLabel="Close"
          onPress={() => router.back()}
        />
        <MonoLabel variant="labelTracked" accessibilityRole="header">
          RISE
        </MonoLabel>
        {play.restart ? (
          // Development builds: play today's six again, as often as wanted.
          <HeaderIconButton
            testID="rise-restart"
            icon={RotateCcw}
            accessibilityLabel="Play again"
            onPress={() => void play.restart?.()}
          />
        ) : (
          <MonoLabel variant="labelTracked" tone="textSupporting" style={styles.day}>
            {play.day}
          </MonoLabel>
        )}
      </View>
      <View style={styles.status}>
        <MonoLabel variant="labelTracked" tone="accent" testID="rise-progress">
          {play.progress ?? play.day}
        </MonoLabel>
        <MonoLabel variant="labelTracked" tone="textSupporting">
          CROSS OUT THE WRONG ONE
        </MonoLabel>
      </View>

      <View
        style={styles.stage}
        onLayout={(event) => {
          const { width, height } = event.nativeEvent.layout;
          play.onLayout({ width, height });
        }}
      >
        {play.stage && play.question && (
          <QuestionLine question={play.question} lineY={play.stage.lineY} />
        )}
        {play.stage && (
          <GestureDetector gesture={play.paint}>
            <View collapsable={false} style={StyleSheet.absoluteFill}>
              <RiseBoard
                testID="rise-board"
                game={play.game}
                onError={play.reportBoardError}
                width={play.stage.width}
                height={play.stage.height}
              />
            </View>
          </GestureDetector>
        )}
        {play.phase === "ready" && <RiseIntro practice={play.practice} onStart={play.start} />}
        {play.phase === "over" && play.result && (
          <RiseFinish
            result={play.result}
            onLearned={() => setLearning(true)}
            onShare={play.sharing.start}
          />
        )}
      </View>

      <PosterSheet
        visible={play.sharing.open}
        posters={play.sharing.posters}
        onPick={play.sharing.pick}
        onClose={play.sharing.close}
      />
      <LearnedSheet
        visible={learning}
        rows={play.result?.rows ?? []}
        onClose={() => setLearning(false)}
      />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: space[12],
    paddingHorizontal: PAGE_INSET,
  },
  // The day, opposite close: the name sits between them.
  day: { minWidth: space[40], textAlign: "right" },
  status: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: space[12],
    paddingHorizontal: PAGE_INSET,
    paddingTop: space[12],
  },
  // The board runs to the screen's foot, so the balloons rise from under it.
  stage: { flex: 1 },
});
