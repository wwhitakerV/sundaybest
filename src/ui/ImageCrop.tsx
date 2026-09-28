import { useId } from "react";
import { View, type ImageSourcePropType, type StyleProp, type ViewStyle } from "react-native";
import Svg, { Defs, Image, LinearGradient, Mask, Rect, Stop } from "react-native-svg";

/** A rectangle in an image's own pixels. */
type Region = { x: number; y: number; width: number; height: number };

export type ImageCropProps = {
  source: ImageSourcePropType;
  /** The whole image's size, in its own pixels. */
  size: { width: number; height: number };
  /** The part of it to show, in the same pixels. */
  crop: Region;
  /**
   * Dissolves the crop's left edge into whatever is behind it, over this
   * share of its width (0–1), so it can sit close to words without a hard
   * edge beside them.
   */
  fadeLeft?: number;
  /** Where it sits and how big it is. Its height follows its width, keeping the crop's shape. */
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/**
 * One region of a larger illustration, shown on its own — so a single piece
 * of art can supply two details placed apart. Decoration: VoiceOver passes
 * over it, and it never takes touches.
 */
export function ImageCrop({ source, size, crop, fadeLeft, style, testID }: ImageCropProps) {
  // Unique per instance: SVG ids are document-global on some renderers.
  const id = useId();
  const fadeId = `image-crop-fade-${id}`;
  const maskId = `image-crop-mask-${id}`;

  return (
    <View
      testID={testID}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[{ aspectRatio: crop.width / crop.height }, style]}
    >
      <Svg
        {...(testID && { testID: `${testID}-frame` })}
        width="100%"
        height="100%"
        viewBox={`${crop.x} ${crop.y} ${crop.width} ${crop.height}`}
      >
        {fadeLeft !== undefined && (
          <Defs>
            {/* A mask's own shades, not a colour of the app's: white shows, clear hides. */}
            <LinearGradient
              id={fadeId}
              x1={crop.x}
              y1="0"
              x2={crop.x + crop.width * fadeLeft}
              y2="0"
              gradientUnits="userSpaceOnUse"
            >
              <Stop offset="0" stopColor="white" stopOpacity={0} />
              <Stop offset="1" stopColor="white" stopOpacity={1} />
            </LinearGradient>
            <Mask id={maskId}>
              <Rect
                x={crop.x}
                y={crop.y}
                width={crop.width}
                height={crop.height}
                fill={`url(#${fadeId})`}
              />
            </Mask>
          </Defs>
        )}
        <Image
          {...(testID && { testID: `${testID}-image` })}
          href={source}
          width={size.width}
          height={size.height}
          {...(fadeLeft !== undefined && { mask: `url(#${maskId})` })}
        />
      </Svg>
    </View>
  );
}
