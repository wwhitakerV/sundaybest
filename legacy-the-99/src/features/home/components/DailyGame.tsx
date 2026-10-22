import { Pressable, StyleSheet, View, useWindowDimensions } from "react-native";
import type { SharedValue } from "react-native-reanimated";
import { Play } from "lucide-react-native";

import { BAND, BOARD, FlockBoard, type FlockGame } from "@/entities/flock";
import { space } from "@/theme";
import { Button } from "@/ui/atoms/Button";
import { PAGE_INSET } from "@/ui/organisms/Screen";
import { MonoLabel } from "@/ui/typography/MonoLabel";
import { SerifTitle } from "@/ui/typography/SerifTitle";
import { SFProBody } from "@/ui/typography/SFProBody";

/** The board's strip on Home: this share of its width tall — a wide figure, not the whole board. */
const STRIP_SHARE = 0.62;
/**
 * Where the strip sits on the board, in its units: from just above the
 * band's line, so the gate and the saved gathering behind it are in it.
 */
const STRIP_CENTER = BAND - 90 + (STRIP_SHARE * BOARD.width) / 2;

export type DailyGameProps = {
  /** "DAILY 001". */
  daily: string;
  /** Today's board, playing itself (`useAttractGame`). */
  game: SharedValue<FlockGame>;
  /** Today's run, in a line — once played. */
  played: string | null;
  onOpen: () => void;
};

/**
 * Today's game on Home, plainly a game and curious to try: a red DAILY GAME
 * label with today's number opposite; the board as a cropped figure — the
 * gate and the band in it — the game playing itself: the wolf arriving, its
 * countdown inside it, then hunting as a shepherd calls the flock home; its
 * title, what it asks, how long it takes, and Play. Once played, how many
 * were saved in its place.
 */
export function DailyGame({ daily, game, played, onOpen }: DailyGameProps) {
  const { width } = useWindowDimensions();
  const boardWidth = width - PAGE_INSET * 2;

  return (
    <View testID="home-daily-game" style={styles.section}>
      <View style={styles.labels}>
        <MonoLabel variant="labelTracked" tone="accent">
          DAILY GAME
        </MonoLabel>
        <MonoLabel variant="labelTracked" tone="textSupporting">
          {daily}
        </MonoLabel>
      </View>
      <Pressable
        testID="home-daily-game-board"
        accessibilityRole="button"
        accessibilityLabel="The 99. Call the flock through the gate before the wolf gets them."
        accessibilityHint="Opens today's game"
        onPress={onOpen}
      >
        <FlockBoard
          game={game}
          width={boardWidth}
          crop={{ height: boardWidth * STRIP_SHARE, centerY: STRIP_CENTER }}
        />
      </Pressable>
      <View style={styles.words}>
        <SerifTitle variant="title" accessibilityRole="header">
          The 99
        </SerifTitle>
        <SFProBody variant="rowDetail" tone="textSupporting">
          {played ??
            "Call the flock of 20 through the gate before the wolf gets them. Under a minute · New every day."}
        </SFProBody>
      </View>
      <Button
        testID="home-daily-game-play"
        label={played ? "See your run" : "Play"}
        {...(!played && { icon: Play })}
        variant={played ? "soft" : "primary"}
        onPress={onOpen}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: space[16] },
  labels: { flexDirection: "row", justifyContent: "space-between", gap: space[12] },
  words: { gap: space[6] },
});
