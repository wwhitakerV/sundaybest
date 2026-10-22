import { Group, Path, Text, useFont } from "@shopify/react-native-skia";
import { useDerivedValue, type SharedValue } from "react-native-reanimated";

import { useTheme } from "@/theme";
import { FONT_ASSETS, fonts } from "@/theme/fonts";
import { type FlockGame } from "../logic/flock-rules";
import {
  WOLF_DRAWN,
  countdownDigit,
  digitOpacity,
  wolfFilled,
  wolfHollow,
  wolfShape,
} from "./flock-paths";

/** The wolf's outline: fine, its points kept sharp. */
const OUTLINE = 2;
/** The countdown's number, this much of the wolf's drawn size: large, inside its inner points. */
const DIGIT_SIZE = 1.25;

export type FlockWolfProps = {
  game: SharedValue<FlockGame>;
  scale: number;
};

/**
 * The wolf, arriving and hunting: a hollow jagged outline in red where it
 * starts; through the countdown, its 3, 2, 1 flashing inside it in Canela as
 * its red rises from its foot — the number red over the hollow, white over
 * the red — until it's solid and the numbers are gone, and it hunts.
 */
export function FlockWolf({ game, scale }: FlockWolfProps) {
  const { accent, onAccent } = useTheme().colors;
  const font = useFont(FONT_ASSETS[fonts.display], WOLF_DRAWN * scale * DIGIT_SIZE);
  const shape = useDerivedValue(() => wolfShape(game.get(), scale));
  const filled = useDerivedValue(() => wolfFilled(game.get(), scale));
  const hollow = useDerivedValue(() => wolfHollow(game.get(), scale));
  const digit = useDerivedValue(() => countdownDigit(game.get()));
  const opacity = useDerivedValue(() => digitOpacity(game.get()));
  // The number centred on the wolf by its own drawn bounds, not its advance.
  const x = useDerivedValue(() => {
    const bounds = font?.measureText(digit.get());
    return game.get().wolf.x * scale - (bounds ? bounds.x + bounds.width / 2 : 0);
  });
  const y = useDerivedValue(() => {
    const bounds = font?.measureText(digit.get());
    return game.get().wolf.y * scale - (bounds ? bounds.y + bounds.height / 2 : 0);
  });

  return (
    <Group>
      <Group clip={filled}>
        <Path path={shape} color={accent} />
      </Group>
      {font && (
        <Group opacity={opacity}>
          <Group clip={hollow}>
            <Text x={x} y={y} text={digit} font={font} color={accent} />
          </Group>
          <Group clip={filled}>
            <Text x={x} y={y} text={digit} font={font} color={onAccent} />
          </Group>
        </Group>
      )}
      <Path path={shape} color={accent} style="stroke" strokeWidth={OUTLINE} strokeJoin="miter" />
    </Group>
  );
}
