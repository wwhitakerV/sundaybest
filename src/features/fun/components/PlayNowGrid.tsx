import { StyleSheet, View, type ImageSourcePropType } from "react-native";
import { Flame } from "lucide-react-native";

import { useTheme, type Theme } from "@/theme";
import DUEL_ART from "../../../../assets/images/fun/duel-boxing-gloves.png";
import TRIVIA_ART from "../../../../assets/images/fun/daily-trivia-lightbulb.png";
import EXAMS_ART from "../../../../assets/images/fun/theology-exams-books.png";
import VERSE_ART from "../../../../assets/images/fun/verse-builder-tiles.png";
import { getFunDestinationTitle, getGameDestination } from "../logic/destinations";
import { getStreakLabel } from "../logic/streak-label";
import type { FunGame } from "../types";
import { GameTile } from "./GameTile";

type Game = {
  key: FunGame;
  title: string;
  detail: string;
  art: ImageSourcePropType;
  /** The art's own width over its height. */
  artAspect: number;
  /** Its share of the tile's width. */
  artWidth: `${number}%`;
  /** The pastel behind it, and the one it blends into, if any. */
  colors: (theme: Theme) => { background: string; blendTo?: string };
};

/** Each game: its words, its art and that art's shape, and the pastels matched to it. */
const GAMES: readonly Game[] = [
  {
    key: "duel",
    title: "1v1 Duel",
    detail: "Challenge a friend live.",
    art: DUEL_ART,
    artAspect: 420 / 210,
    artWidth: "62%",
    colors: (theme) => ({
      background: theme.colors.illustrationBlush,
      blendTo: theme.colors.illustrationLilac,
    }),
  },
  {
    key: "trivia",
    title: "Daily Trivia",
    detail: "New questions every day.",
    art: TRIVIA_ART,
    artAspect: 420 / 437,
    artWidth: "38%",
    colors: (theme) => ({ background: theme.colors.illustrationButter }),
  },
  {
    key: "exams",
    title: "Theology Exams",
    detail: "Beginner to Scholar.",
    art: EXAMS_ART,
    artAspect: 420 / 339,
    artWidth: "44%",
    colors: (theme) => ({ background: theme.colors.illustrationLilac }),
  },
  {
    key: "verse-builder",
    title: "Verse Builder",
    detail: "Fast memory challenge.",
    art: VERSE_ART,
    artAspect: 420 / 280,
    artWidth: "48%",
    colors: (theme) => ({ background: theme.colors.illustrationSky }),
  },
];

const COLUMNS = 2;

export type PlayNowGridProps = {
  /** The games to show, of the four; the rest are left out, keeping their order. */
  games: readonly FunGame[];
  /** The user's current streak, in days, for Daily Trivia's tile. */
  streakDays: number;
  onOpenGame: (game: FunGame) => void;
  testID: string;
};

/**
 * Fun's games, two to a row — Duel and Daily Trivia, then Theology Exams and
 * Verse Builder — or just the ones a category picked, still half-width.
 */
export function PlayNowGrid({ games, streakDays, onOpenGame, testID }: PlayNowGridProps) {
  const theme = useTheme();
  const gap = theme.spacing.sm;
  const shown = GAMES.filter((game) => games.includes(game.key));
  const rows = [shown.slice(0, COLUMNS), shown.slice(COLUMNS)].filter((row) => row.length > 0);

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
              artWidth={game.artWidth}
              {...game.colors(theme)}
              {...(game.key === "trivia" && {
                badge: { label: getStreakLabel(streakDays), icon: Flame },
              })}
              accessibilityHint={`Opens ${getFunDestinationTitle(getGameDestination(game.key))}`}
              onPress={() => onOpenGame(game.key)}
            />
          ))}
          {/* Holds a lone game to half the row, in its column. */}
          {row.length < COLUMNS && <View style={styles.empty} />}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "stretch" },
  empty: { flex: 1 },
});
