import {
  Blur,
  BlurMask,
  ColorMatrix,
  FractalNoise,
  Group,
  Paint,
  Path,
  Rect,
} from "@shopify/react-native-skia";

import { FORMATION_INLAY } from "@/theme";
import { STONE } from "../logic/formation-stone";
import { greyOf, withAlpha } from "./ideal-paint";
import { polyline } from "./stone-paths";

/** How far the threads run each way from its middle (its half-widths): past any outline. */
const SPAN = 1.6;

/** How many pieces each thread is drawn in, so it can waver. */
const PIECES = 24;

/**
 * The linen's threads — its rows, and the threads across them — each
 * wavering a little off its line as a woven thread does: worked out once
 * (the same every time — its waver comes from where it is, not from chance).
 */
const [ROWS, ACROSS] = (() => {
  const { every, uneven } = STONE.weave;
  const waver = (a: number, b: number) =>
    Math.sin(a * 12.9898 + b * 78.233) * Math.sin(a * 3.1 + b * 7.7) * every * uneven * 2;
  const rows: string[] = [];
  const crossing: string[] = [];
  for (let at = -SPAN; at <= SPAN; at += every) {
    const across: string[] = [];
    const down: string[] = [];
    for (let k = 0; k <= PIECES; k += 1) {
      const t = -SPAN + (k / PIECES) * SPAN * 2;
      const step = k === 0 ? "M" : "L";
      across.push(`${step} ${t} ${at + waver(at, t)}`);
      down.push(`${step} ${at + waver(t, at)} ${t}`);
    }
    rows.push(across.join(" "));
    crossing.push(down.join(" "));
  }
  return [rows.join(" "), crossing.join(" ")];
})();

/** Noise as a mask: kept where it's brighter than `from`, sharply. */
const maskOf = (from: number, gain: number) => [
  ...[0, 0, 0, 0, 0],
  ...[0, 0, 0, 0, 0],
  ...[0, 0, 0, 0, 0],
  ...[0.2126 * gain, 0.7152 * gain, 0.0722 * gain, 0, -from * gain],
];

/**
 * The threads, at the weave's seeded `angle`, drawn in `colour` at `alpha`
 * — the threads across its rows fainter — broken up in places.
 */
export function WeaveThreads({
  angle,
  colour,
  alpha,
}: {
  angle: number;
  colour: (alpha: number) => Float32Array;
  alpha: number;
}) {
  const { thread, broken, across } = STONE.weave;
  return (
    <Group transform={[{ rotate: angle }]}>
      <Path path={ROWS} style="stroke" strokeWidth={thread} color={colour(alpha)} />
      <Path path={ACROSS} style="stroke" strokeWidth={thread} color={colour(alpha * across)} />
      <Rect x={-SPAN} y={-SPAN} width={SPAN * 2} height={SPAN * 2} blendMode="dstIn">
        <FractalNoise freqX={broken} freqY={broken} octaves={2} />
        <ColorMatrix matrix={maskOf(0.3, 4)} />
      </Rect>
    </Group>
  );
}

/** The linen pressed into it, in its height: crossed threads standing up, catching the light. */
export function WeaveHeight({ angle }: { angle: number }) {
  return (
    <Group
      layer={
        <Paint blendMode="plus">
          <Blur blur={STONE.weave.thread * 0.6} />
        </Paint>
      }
    >
      <WeaveThreads angle={angle} colour={(a) => greyOf(1, a)} alpha={STONE.weave.depth} />
    </Group>
  );
}

const grimeAt = (alpha: number) => withAlpha(FORMATION_INLAY.stoneGrime, alpha);

/**
 * The weave filled with grime: faintly all over (`haze`), and darker inside
 * its `smudges` (soft-edged), so its dirty patches show the linen most.
 */
export function WeaveGrime({ angle, smudges }: { angle: number; smudges: string[] }) {
  const { soft } = STONE.smudges;
  return (
    <>
      <Group layer={<Paint blendMode="srcATop" />}>
        <WeaveThreads angle={angle} colour={grimeAt} alpha={STONE.weave.haze} />
      </Group>
      <DirtyWeave angle={angle} smudges={smudges} soft={soft} />
    </>
  );
}

/** The weave's grime inside its smudges. */
function DirtyWeave({ angle, smudges, soft }: { angle: number; smudges: string[]; soft: number }) {
  return (
    <Group layer={<Paint blendMode="srcATop" />}>
      <WeaveThreads angle={angle} colour={grimeAt} alpha={STONE.weave.grime} />
      <Group layer={<Paint blendMode="dstIn" />}>
        {smudges.map((smudge, i) => (
          <Path key={`smudge-${i}`} path={smudge} color={greyOf(0, 1)}>
            <BlurMask blur={soft} style="normal" />
          </Path>
        ))}
      </Group>
    </Group>
  );
}

/** Its big rubbed smudges of grime: soft-edged, streaked as if wiped. */
export function Smudges({ smudges }: { smudges: string[] }) {
  const { soft, strength, streak } = STONE.smudges;
  const [along = 3, across = 14] = streak;
  return (
    <Group layer={<Paint blendMode="srcATop" />}>
      {smudges.map((smudge, i) => (
        <Path
          key={`smudge-${i}`}
          path={smudge}
          color={withAlpha(FORMATION_INLAY.stoneGrime, strength)}
        >
          <BlurMask blur={soft} style="normal" />
        </Path>
      ))}
      <Rect x={-SPAN} y={-SPAN} width={SPAN * 2} height={SPAN * 2} blendMode="dstIn">
        <FractalNoise freqX={along} freqY={across} octaves={3} />
        <ColorMatrix matrix={maskOf(0.15, 2.2)} />
      </Rect>
    </Group>
  );
}

/** Its smudges, as paths. */
export const smudgePaths = (smudges: { x: number; y: number }[][]) =>
  smudges.map((smudge) => polyline(smudge, true));
