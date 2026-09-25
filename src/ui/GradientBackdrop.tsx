import { useId } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Defs, Image, LinearGradient, Mask, Rect, Stop } from "react-native-svg";

import type { BackdropStop } from "@/utils/color/getBackdropStops";
import { getSmoothFadeStops } from "@/utils/color/getSmoothFadeStops";

/** How quickly a revealed gradient gathers to solid once its fade's under way. */
const FADE_DENSITY = 1;
/**
 * A revealed gradient's fade: easing in softly from clear, so its start
 * never shows as a line, then quickly dense — solid well before halfway,
 * rather than see-through for most of its length.
 */
const FADE_STOPS = getSmoothFadeStops().map(({ offset, opacity }) => ({
  offset,
  opacity: 1 - (1 - opacity) ** FADE_DENSITY,
}));

export type GradientBackdropProps = {
  /** The gradient's colours, first to last (`getBackdropStops`). */
  stops: readonly BackdropStop[];
  /**
   * Shows it only from a line down (points from its top): clear above
   * `from`, fading in to solid by `to`. Laid over the same gradient, it's
   * seamless — and covers whatever passes under that line.
   */
  reveal?: { from: number; to: number };
  /** An image washed over the gradient at `opacity`, filling it edge to edge. */
  underlay?: { uri: string; opacity: number };
  testID?: string;
};

/**
 * A smooth diagonal gradient filling whatever it's placed in — top left to
 * bottom right — behind its container's content. Never takes touches.
 */
export function GradientBackdrop({ stops, reveal, underlay, testID }: GradientBackdropProps) {
  // Unique per instance: SVG gradient ids are document-global on some renderers.
  const id = useId();
  const gradientId = `gradient-backdrop-${id}`;
  const fadeId = `gradient-backdrop-fade-${id}`;
  const maskId = `gradient-backdrop-mask-${id}`;

  return (
    <View testID={testID} pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%">
        <Defs>
          <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            {stops.map(({ offset, color }) => (
              <Stop key={`${offset}-${color}`} offset={offset} stopColor={color} stopOpacity={1} />
            ))}
          </LinearGradient>
          {reveal && (
            <>
              {/* A mask's own shades, not a colour of the app's: white shows, clear hides. */}
              <LinearGradient
                id={fadeId}
                x1="0"
                y1={reveal.from}
                x2="0"
                y2={reveal.to}
                gradientUnits="userSpaceOnUse"
              >
                {FADE_STOPS.map(({ offset, opacity }) => (
                  <Stop key={offset} offset={offset} stopColor="white" stopOpacity={opacity} />
                ))}
              </LinearGradient>
              <Mask id={maskId}>
                <Rect width="100%" height="100%" fill={`url(#${fadeId})`} />
              </Mask>
            </>
          )}
        </Defs>
        <Rect
          {...(testID && { testID: `${testID}-fill` })}
          width="100%"
          height="100%"
          fill={`url(#${gradientId})`}
          {...(reveal && { mask: `url(#${maskId})` })}
        />
        {underlay && (
          <Image
            {...(testID && { testID: `${testID}-underlay` })}
            href={{ uri: underlay.uri }}
            width="100%"
            height="100%"
            preserveAspectRatio="xMidYMid slice"
            opacity={underlay.opacity}
            {...(reveal && { mask: `url(#${maskId})` })}
          />
        )}
      </Svg>
    </View>
  );
}
