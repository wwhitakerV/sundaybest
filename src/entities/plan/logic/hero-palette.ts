import { getBackdropStops, type BackdropStop } from "@/utils/color/getBackdropStops";
import { prefersLightInk } from "@/utils/color/prefersLightInk";

/** A plan hero's colours, from its sermon's. */
export type HeroPalette = {
  /** The strongest colour — the hero's own — or the fallback until they're known. */
  colour: string;
  /** The gradient behind it. */
  stops: BackdropStop[];
  /** Whether type on it is white (on a dark colour) rather than black. */
  light: boolean;
};

/** The hero's colour, its gradient, and its ink, from the sermon's colours (strongest first). */
export function getHeroPalette(colors: readonly string[], fallback: string): HeroPalette {
  const colour = colors.at(0) ?? fallback;
  return { colour, stops: getBackdropStops(colors, fallback), light: prefersLightInk(colour) };
}
