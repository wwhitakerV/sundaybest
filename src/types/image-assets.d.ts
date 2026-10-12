/**
 * `import x from "*.png"` resolves to a Metro asset module — an asset ID
 * number — which React Native's `Image` accepts as its `source`. Typed as
 * `number` to match what Metro's asset transform produces, like the font
 * shim beside it.
 */
declare module "*.png" {
  const assetId: number;
  // eslint-disable-next-line import/no-default-export -- an asset-module shim has no named export to offer; `import x from "*.png"` is the only shape Metro's own resolution supports.
  export default assetId;
}

declare module "*.jpg" {
  const assetId: number;
  // eslint-disable-next-line import/no-default-export -- an asset-module shim has no named export to offer; `import x from "*.jpg"` is the only shape Metro's own resolution supports.
  export default assetId;
}

/**
 * `import X from "*.svg"` is a component drawing that file (react-native-svg-transformer,
 * set up in metro.config.js), sized by the file's own width and height unless given others.
 */
declare module "*.svg" {
  import type { FC } from "react";
  import type { SvgProps } from "react-native-svg";
  const Artwork: FC<SvgProps>;
  // eslint-disable-next-line import/no-default-export -- an asset-module shim has no named export to offer; `import X from "*.svg"` is the only shape the transformer produces.
  export default Artwork;
}
