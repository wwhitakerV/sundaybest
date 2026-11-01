import type { ComponentProps } from "react";
import { Blur, ColorMatrix, Group, Image, Paint, type SkImage } from "@shopify/react-native-skia";

export type ShadowCopyProps = {
  /** The object's artwork: its shadow takes the art's own outline. */
  image: SkImage;
  /** Where the unit outline (half-width 1, centred) is laid (`shadowTransform`). */
  transform: NonNullable<ComponentProps<typeof Group>["transform"]>;
  /** Its softness, in the board's points: blurred where it's laid, never in the unit outline's scale. */
  blur: NonNullable<ComponentProps<typeof Blur>["blur"]>;
  /** Its tint (`TINTS`), as red, green and blue, 0–1. */
  tint: Float32Array;
  /** How strong it is, 0–1: still, or moving with its object. */
  strength: NonNullable<ComponentProps<typeof Paint>["opacity"]>;
};

/** Every pixel of the art as the tint, keeping only the art's coverage: its silhouette, solid. */
function silhouette(tint: Float32Array): number[] {
  return [
    0,
    0,
    0,
    0,
    tint[0] ?? 0,
    0,
    0,
    0,
    0,
    tint[1] ?? 0,
    0,
    0,
    0,
    0,
    tint[2] ?? 0,
    0,
    0,
    0,
    1,
    0,
  ];
}

/**
 * One soft copy of an object's outline — its artwork's silhouette, in the
 * shadow's tint — multiplied into the page: still, or moving with its object.
 */
export function ShadowCopy({ image, transform, blur, tint, strength }: ShadowCopyProps) {
  const aspect = image.height() / image.width();
  return (
    <Group
      layer={
        <Paint blendMode="multiply" opacity={strength}>
          <Blur blur={blur} />
        </Paint>
      }
    >
      <Group transform={transform}>
        <Image image={image} x={-1} y={-aspect} width={2} height={2 * aspect} fit="fill">
          <ColorMatrix matrix={silhouette(tint)} />
        </Image>
      </Group>
    </Group>
  );
}
