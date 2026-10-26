import { StyleSheet, View } from "react-native";
import { Canvas, Circle, Line, Path, vec } from "@shopify/react-native-skia";

import { FORMATION_PAPER, space, useTheme } from "@/theme";
import { DisplayTitle } from "@/ui/typography/DisplayTitle";
import { MonoLabel } from "@/ui/typography/MonoLabel";
import { AccentArt } from "./AccentArt";
import { withAlpha } from "./ideal-paint";

/**
 * The title's box: the page's width less its insets, and this share of the
 * screen's width tall — the same proportions on every iPhone, two lines of
 * the title at its largest. The title shrinks to fit it, never the box.
 */
const TITLE_BOX = { height: 0.32 };
/** The red ring at the top right, as the reference's: its size and its stroke. */
const RING = { size: 22, stroke: 0.9 };
/** The line art under the title, where the reference's colour label sat: its row's height, and its width of the box. */
const UNDER = { height: 10, share: 0.13 };
/** The small pencilled cross at that row's right: half its arm. */
const CROSS = 3.2;

/** The red ring with a small swash in it, at the header's top right. */
function HeaderRing({ colour }: { colour: string }) {
  const c = RING.size / 2;
  return (
    <Canvas style={styles.ring} pointerEvents="none">
      <Circle
        cx={c}
        cy={c}
        r={c - RING.stroke}
        style="stroke"
        strokeWidth={RING.stroke}
        color={colour}
      />
      <Path
        path={`M ${c - 1.4} ${c - 4} C ${c + 2.6} ${c - 2.4} ${c - 2.6} ${c + 1.2} ${c + 1.2} ${c + 4}`}
        style="stroke"
        strokeWidth={RING.stroke}
        strokeCap="round"
        color={withAlpha(FORMATION_PAPER.graphite, 0.8)}
      />
    </Canvas>
  );
}

/** Under the title: red line art at the left, a pencilled cross at the right. */
function UnderTitle({ width, colour }: { width: number; colour: string }) {
  const mid = UNDER.height / 2;
  const graphite = withAlpha(FORMATION_PAPER.graphite, 0.75);
  const arm = (dx: number) => (
    <Line
      p1={vec(width - CROSS - dx, mid - CROSS)}
      p2={vec(width - CROSS + dx, mid + CROSS)}
      style="stroke"
      strokeWidth={0.8}
      strokeCap="round"
      color={graphite}
    />
  );
  return (
    <Canvas style={{ width, height: UNDER.height }} pointerEvents="none">
      <AccentArt x={0} y={mid} width={width * UNDER.share} colour={colour} seed={3} />
      {arm(CROSS)}
      {arm(-CROSS)}
    </Canvas>
  );
}

export type IdealHeaderProps = {
  /** The page's width less its insets. */
  width: number;
  /** The screen's width: the title's box is a share of it. */
  screenWidth: number;
  /** The plan's title: none until the plans are in, its box held open meanwhile. */
  title: string | null;
  testID?: string;
};

/**
 * vIdeal's header, in its reference's style: a small red standing label and
 * a red ring above; the title, as large as its box allows (`DisplayTitle`
 * `fit`); a line of accent art under it.
 */
export function IdealHeader({ width, screenWidth, title, testID }: IdealHeaderProps) {
  const { colors } = useTheme();
  const boxHeight = screenWidth * TITLE_BOX.height;
  return (
    <View testID={testID}>
      <View style={styles.row}>
        <MonoLabel variant="label" tone="accent">
          Formation
        </MonoLabel>
        <HeaderRing colour={colors.accent} />
      </View>
      <View style={[styles.box, { width, height: boxHeight }]}>
        {title && (
          <DisplayTitle variant="fit" testID="formation-title" style={{ width, height: boxHeight }}>
            {title}
          </DisplayTitle>
        )}
      </View>
      <UnderTitle width={width} colour={colors.accent} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  ring: { width: RING.size, height: RING.size },
  box: { marginTop: space[24], marginBottom: space[16] },
});
