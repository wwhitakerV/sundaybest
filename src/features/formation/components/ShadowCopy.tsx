import type { ComponentProps } from "react";
import { BlurMask, Circle, Group, Path } from "@shopify/react-native-skia";

import { HEART_PATH } from "../logic/formation-glyphs";

export type ShadowCopyProps = {
  /** The heart's outline, or a disc's. */
  heart: boolean;
  /** Where its unit outline is laid (`shadowTransform`). */
  transform: NonNullable<ComponentProps<typeof Group>["transform"]>;
  /** Its softness, in the unit outline's own scale. */
  blur: NonNullable<ComponentProps<typeof BlurMask>["blur"]>;
  colour: NonNullable<ComponentProps<typeof Circle>["color"]>;
};

/** One soft copy of an object's outline, multiplied into the page: still, or moving with its object. */
export function ShadowCopy({ heart, transform, blur, colour }: ShadowCopyProps) {
  return (
    <Group transform={transform}>
      {heart ? (
        <Path path={HEART_PATH} color={colour} blendMode="multiply">
          <BlurMask blur={blur} style="normal" />
        </Path>
      ) : (
        <Circle cx={0} cy={0} r={1} color={colour} blendMode="multiply">
          <BlurMask blur={blur} style="normal" />
        </Circle>
      )}
    </Group>
  );
}
