import { StyleSheet, View, type ImageSourcePropType } from "react-native";
import { Flame } from "lucide-react-native";

import { useTheme, type Theme } from "@/theme";
import DUEL_ART from "../../../../assets/images/fun/02_duel_boxing_gloves.png";
import TRIVIA_ART from "../../../../assets/images/fun/03_daily_trivia_lightbulb.png";
import EXAMS_ART from "../../../../assets/images/fun/04_theology_exams_books.png";
import VERSE_ART from "../../../../assets/images/fun/05_verse_builder_tiles.png";
import { getStreakLabel } from "../logic/streak-label";
import { GameTile } from "./GameTile";

type FunGame = "duel" | "trivia" | "exams" | "verse-builder";

type Game = {
  key: FunGame;
  title: string;
  detail: string;
  art: ImageSourcePropType;
  /** The art's own width over its height. */
  artAspect: number;
  background: (theme: Theme) => string;
};

/** Each game: its words, its art and that art's shape, and the pastel matched to it. */
const GAMES: readonly Game[] = [
  {
    key: "duel",
    title: "1v1 Duel",
    detail: "Challenge a friend live.",
    art: DUEL_ART,
    artAspect: 241 / 192,
    background: (theme: Theme) => theme.colors.illustrationBlush,
  },
  {
    key: "trivia",
    title: "Daily Trivia",
    detail: "New questions every day.",
    art: TRIVIA_ART,
    artAspect: 218 / 196,
    background: (theme: Theme) => theme.colors.illustrationButter,
  },
  {
    key: "exams",
    title: "Theology Exams",
    detail: "Beginner to Scholar.",
    art: EXAMS_ART,
    artAspect: 193 / 187,
    background: (theme: Theme) => theme.colors.illustrationLilac,
  },
  {
    key: "verse-builder",
    title: "Verse Builder",
    detail: "Fast memory challenge.",
    art: VERSE_ART,
    artAspect: 223 / 181,
    background: (theme: Theme) => theme.colors.illustrationSky,
  },
];

const COLUMNS = 2;

export type PlayNowGridProps = {
  /** The user's current streak, in days, for Daily Trivia's tile. */
  streakDays: number;
  onOpenGame: (game: FunGame) => void;
  testID: string;
};

/** Fun's games, two to a row: Duel and Daily Trivia, then Theology Exams and Verse Builder. */
export function PlayNowGrid({ streakDays, onOpenGame, testID }: PlayNowGridProps) {
  const theme = useTheme();
  const gap = theme.spacing.sm;
  const rows = [GAMES.slice(0, COLUMNS), GAMES.slice(COLUMNS)];

  return (
    <View testID={testID} style={{ gap }}>
      {rows.map((row) => (
        <View key={row.map((game) => game.key).join("-")} style={[styles.row, { gap }]}>
          {row.map((game) => (
            <GameTile
              key={game.key}
              testID={`${testID}-${game.key}`}
              title={game.title}
              detail={game.detail}
              art={game.art}
              artAspect={game.artAspect}
              background={game.background(theme)}
              {...(game.key === "trivia" && {
                badge: { label: getStreakLabel(streakDays), icon: Flame },
              })}
              onPress={() => onOpenGame(game.key)}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "stretch" },
});
