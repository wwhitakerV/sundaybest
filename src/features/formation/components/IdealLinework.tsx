import { BlurMask, Circle, Group, Path } from "@shopify/react-native-skia";

import { FORMATION_PAPER } from "@/theme";
import {
  IDEAL_ACCENTS,
  IDEAL_CONNECTORS,
  IDEAL_DOTS,
  IDEAL_STRANDS,
} from "../logic/formation-ideal";
import { smoothPathOf } from "../logic/formation-line";
import { pencilPassesOf } from "../logic/formation-pencil";
import { AccentArt } from "./AccentArt";
import { withAlpha } from "./ideal-paint";

/** A red dot's soft halo: this much wider than the dot, this strong. */
const HALO = { scale: 1.7, opacity: 0.16 };

export type IdealLineworkProps = { width: number; accent: string };

/**
 * What's drawn on vIdeal's paper, under its objects: the pencil lines
 * sweeping round them, the red threads joining each to the next, the red
 * dots, and the line art where the labels stood. All in shares of `width`.
 */
export function IdealLinework({ width, accent }: IdealLineworkProps) {
  const px = (p: { x: number; y: number }) => ({ x: p.x * width, y: p.y * width });
  const { graphite, connector } = FORMATION_PAPER;
  return (
    <Group>
      {IDEAL_STRANDS.flatMap((strand, i) =>
        pencilPassesOf(strand.map(px), i + 1).map((pass, k) => (
          <Path
            key={`strand-${i}-${k}`}
            path={pass.d}
            style="stroke"
            strokeWidth={pass.width}
            strokeCap="round"
            color={withAlpha(graphite, pass.opacity)}
          />
        )),
      )}
      {IDEAL_CONNECTORS.map((thread, i) => (
        <Path
          key={`thread-${i}`}
          path={smoothPathOf(thread.points.map(px))}
          style="stroke"
          strokeWidth={thread.width}
          strokeCap="round"
          color={connector}
        />
      ))}
      {IDEAL_DOTS.map((dot) => {
        const at = px(dot);
        const r = dot.r * width;
        return (
          <Group key={`dot-${dot.x}-${dot.y}`}>
            <Circle
              cx={at.x}
              cy={at.y}
              r={r * HALO.scale}
              color={withAlpha(connector, HALO.opacity)}
            >
              <BlurMask blur={r} style="normal" />
            </Circle>
            <Circle cx={at.x} cy={at.y} r={r} color={connector} />
          </Group>
        );
      })}
      {IDEAL_ACCENTS.map((mark, i) => (
        <AccentArt
          key={`accent-${i}`}
          x={mark.x * width}
          y={mark.y * width}
          width={(mark.to - mark.x) * width}
          colour={mark.tone === "red" ? accent : withAlpha(graphite, 0.75)}
          seed={i + 11}
          lead={mark.lead ?? false}
        />
      ))}
    </Group>
  );
}
