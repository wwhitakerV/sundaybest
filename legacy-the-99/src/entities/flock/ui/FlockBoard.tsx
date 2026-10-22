import { StyleSheet, View } from "react-native";
import { Canvas, DashPathEffect, Group, Path } from "@shopify/react-native-skia";
import { useDerivedValue, type SharedValue } from "react-native-reanimated";

import { useTheme } from "@/theme";
import { BOARD, type FlockGame } from "../logic/flock-rules";
import {
  bandLine,
  fieldSheep,
  gateBar,
  ring,
  ringOpacity,
  savedSheep,
  wolfVision,
} from "./flock-paths";
import { FlockWolf } from "./FlockWolf";

/** The board's edge: a printed figure's thin rule. */
const EDGE = 1;
/** The band's line: faint. The wolf's eyes and the call's waves: fine, the eyes dashed. */
const BAND_OPACITY = 0.18;
const STROKE = { vision: 1.5, ring: 1.5 };
const DASH = [6, 6];
/** The reddening, in three shades over the black: a sheep in more danger, a deeper red. */
const SHADES = [
  { least: 0.15, most: 0.45, opacity: 0.35 },
  { least: 0.45, most: 0.75, opacity: 0.65 },
  { least: 0.75, most: 1.01, opacity: 1 },
];
/** How many call waves can be on the board at once. */
const RING_SLOTS = 8;

/** One call wave, spreading and fading. */
function Wave({
  game,
  slot,
  scale,
  color,
}: {
  game: SharedValue<FlockGame>;
  slot: number;
  scale: number;
  color: string;
}) {
  const path = useDerivedValue(() => ring(game.get(), slot, scale));
  const opacity = useDerivedValue(() => ringOpacity(game.get(), slot));
  return (
    <Group opacity={opacity}>
      <Path path={path} color={color} style="stroke" strokeWidth={STROKE.ring} />
    </Group>
  );
}

/** The field's sheep in one shade of danger: black, under red at this strength. */
function Shade({
  game,
  least,
  most,
  opacity,
  scale,
  color,
}: {
  game: SharedValue<FlockGame>;
  least: number;
  most: number;
  opacity: number;
  scale: number;
  color: string;
}) {
  const path = useDerivedValue(() => fieldSheep(game.get(), scale, least, most));
  return (
    <Group opacity={opacity}>
      <Path path={path} color={color} />
    </Group>
  );
}

export type FlockBoardProps = {
  /** The game as it stands, stepped elsewhere (`advance`) — or a still board. */
  game: SharedValue<FlockGame>;
  /** How wide to draw it: its height follows the board's shape. */
  width: number;
  /** Only a strip of the board, this tall on screen, centred on `centerY` (board units) — Home's preview. */
  crop?: { height: number; centerY: number };
  testID?: string;
};

/**
 * The 99's board, drawn: a printed figure on the page — its thin rule round
 * the edge — the saved gathering red in the band, a faint line and the gate
 * below them, the flock as ink dots reddening as the wolf nears, the call's
 * waves spreading from the finger, and the wolf — a jagged red star with its
 * dashed V of eyes, its countdown inside it as it fills red (`FlockWolf`).
 * It only draws what it's given; it never moves anything.
 */
export function FlockBoard({ game, width, crop, testID }: FlockBoardProps) {
  const theme = useTheme();
  const { text, accent } = theme.colors;
  const scale = width / BOARD.width;
  const height = crop?.height ?? BOARD.height * scale;
  const shift = crop ? crop.height / 2 - crop.centerY * scale : 0;
  const line = useDerivedValue(() => bandLine(scale));
  const gate = useDerivedValue(() => gateBar(game.get(), scale));
  const saved = useDerivedValue(() => savedSheep(game.get(), scale));
  const flock = useDerivedValue(() => fieldSheep(game.get(), scale, 0, 2));
  const eyes = useDerivedValue(() => wolfVision(game.get(), scale));

  return (
    <View
      testID={testID}
      style={[styles.frame, { width, height, borderColor: theme.colors.containerBorder }]}
    >
      <Canvas style={StyleSheet.absoluteFill}>
        <Group transform={[{ translateY: shift }]}>
          <Group opacity={BAND_OPACITY}>
            <Path path={line} color={text} style="stroke" strokeWidth={EDGE} />
          </Group>
          <Path path={gate} color={text} />
          <Path path={saved} color={accent} />
          <Path path={flock} color={text} />
          {SHADES.map((shade) => (
            <Shade key={shade.least} game={game} {...shade} scale={scale} color={accent} />
          ))}
          {Array.from({ length: RING_SLOTS }, (_, slot) => (
            <Wave key={slot} game={game} slot={slot} scale={scale} color={text} />
          ))}
          <Path path={eyes} color={accent} style="stroke" strokeWidth={STROKE.vision}>
            <DashPathEffect intervals={DASH} />
          </Path>
          <FlockWolf game={game} scale={scale} />
        </Group>
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { borderWidth: EDGE, overflow: "hidden" },
});
