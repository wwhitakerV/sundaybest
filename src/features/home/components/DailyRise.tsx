import { Pressable, StyleSheet, View } from "react-native";
import type { SharedValue } from "react-native-reanimated";
import { Play } from "lucide-react-native";

import { RiseBoard, type RiseGame } from "@/entities/rise";
import { space } from "@/theme";
import { Button } from "@/ui/atoms/Button";
import { MonoLabel } from "@/ui/typography/MonoLabel";
import { SerifTitle } from "@/ui/typography/SerifTitle";
import { SFProBody } from "@/ui/typography/SFProBody";

export type DailyRiseProps = {
  /** "DAY 001". */
  day: string;
  /** The preview, playing itself (`useRiseAutoplay`). */
  game: SharedValue<RiseGame>;
  width: number;
  height: number;
  /** Today's score, in a line — once played. */
  played: string | null;
  onOpen: () => void;
};

/**
 * Today's game on Home, plainly a game: a red DAILY GAME label with today's
 * number opposite; the preview, balloons rising and being crossed out, one
 * bursting in black; its name, what it asks, how long it takes, and Play.
 * Once played, today's score in its place.
 */
export function DailyRise({ day, game, width, height, played, onOpen }: DailyRiseProps) {
  return (
    <View testID="home-daily-game" style={styles.section}>
      <View style={styles.labels}>
        <MonoLabel variant="labelTracked" tone="accent">
          DAILY GAME
        </MonoLabel>
        <MonoLabel variant="labelTracked" tone="textSupporting">
          {day}
        </MonoLabel>
      </View>
      <Pressable
        testID="home-daily-game-board"
        accessibilityRole="button"
        accessibilityLabel="Rise. Cross out the wrong answer before its balloon rises."
        accessibilityHint="Opens today's game"
        onPress={onOpen}
      >
        <RiseBoard game={game} width={width} height={height} />
      </Pressable>
      <View style={styles.words}>
        <SerifTitle variant="title" accessibilityRole="header">
          Rise
        </SerifTitle>
        <SFProBody variant="rowDetail" tone="textSupporting">
          {played ??
            "Six questions, two answers each. Cross out the wrong one before its balloon rises. Thirty seconds · New every day."}
        </SFProBody>
      </View>
      <Button
        testID="home-daily-game-play"
        label={played ? "See your result" : "Play"}
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
