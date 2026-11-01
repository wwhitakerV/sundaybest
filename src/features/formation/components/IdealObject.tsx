import { Image, type SkImage } from "@shopify/react-native-skia";

export type IdealObjectProps = {
  cx: number;
  cy: number;
  /** Its width on the board. */
  diameter: number;
  /** Its artwork (`useFacultyArt`); nothing is drawn until it's ready. */
  image: SkImage | null;
};

/**
 * One of the board's objects — each faculty's — drawn as its artwork, its
 * own width across and its own shape tall, centred on its place. The art
 * carries its own light, from the upper right as the board's is; its shadow
 * is drawn beneath it from its outline (`ShadowCopy`).
 */
export function IdealObject({ cx, cy, diameter, image }: IdealObjectProps) {
  if (!image) return null;
  const height = (diameter * image.height()) / image.width();
  return (
    <Image
      image={image}
      x={cx - diameter / 2}
      y={cy - height / 2}
      width={diameter}
      height={height}
      fit="fill"
    />
  );
}
