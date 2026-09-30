import { StyleSheet, View, type ImageSourcePropType, type ImageStyle } from "react-native";
import { Flame } from "lucide-react-native";

import { useTheme, type Theme } from "@/theme";
import DUEL_ART from "../../../../assets/images/fun/duel-boxing-gloves.png";
import TRIVIA_ART from "../../../../assets/images/fun/daily-trivia-lightbulb.png";
import EXAMS_ART from "../../../../assets/images/fun/theology-exams-books.png";
import VERSE_ART from "../../../../assets/images/fun/verse-builder-tiles.png";
import { getStreakLabel } from "../logic/streak-label";
import type { FunGame } from "../types";
import { GameTile } from "./GameTile";

/**
 * The duel's tilt, clockwise — the red glove up, the blue one down — so the
 * pair fills more of the tile. Past about 30° they'd reach the title and the
 * chevron.
 */
const DUEL_TILT = "30deg";
/** The gloves, set a little higher in their tile — straight up, before the tilt. */
const DUEL_LIFT = 10;
/** The books, set a little lower in their tile. */
const BOOKS_DROP = 6;

type Game = {
  key: FunGame;
  title: string;
  detail: string;
  art: ImageSourcePropType;
  /** The art's own width over its height. */
  artAspect: number;
  /** Its share of the room it's centred in, as large as that allows — over 1 reaches into the tile's padding. */
  artShare: number;
  /** Points wider (or narrower) than that, keeping its shape. */
  artExtra?: number;
  /** A turn or tilt of the art, if any. */
  artTransform?: ImageStyle["transform"];
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
    artShare: 1.1,
    artExtra: 13,
    artTransform: [{ translateY: -DUEL_LIFT }, { rotate: DUEL_TILT }],
    colors: (theme) => ({
      background: theme.colors.illustrationRose,
      blendTo: theme.colors.illustrationLilac,
    }),
  },
  {
    key: "trivia",
    title: "Daily Trivia",
    detail: "New questions every day.",
    art: TRIVIA_ART,
    artAspect: 420 / 437,
    artShare: 1,
    colors: (theme) => ({ background: theme.colors.illustrationButter }),
  },
  {
    key: "exams",
    title: "Theology Exams",
    detail: "Beginner to Scholar.",
    art: EXAMS_ART,
    artAspect: 420 / 339,
    artShare: 1,
    artExtra: -13,
    artTransform: [{ translateY: BOOKS_DROP }],
    colors: (theme) => ({ background: theme.colors.illustrationLilac }),
  },
  {
    key: "verse-builder",
    title: "Verse Builder",
    detail: "Fast memory challenge.",
    art: VERSE_ART,
    artAspect: 420 / 280,
    artShare: 1,
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
              artShare={game.artShare}
              {...(game.artExtra !== undefined && { artExtra: game.artExtra })}
              {...(game.artTransform && { artTransform: game.artTransform })}
              {...game.colors(theme)}
              {...(game.key === "trivia" && {
                badge: { label: getStreakLabel(streakDays), icon: Flame },
              })}
              accessibilityHint={`Opens ${game.title}`}
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
