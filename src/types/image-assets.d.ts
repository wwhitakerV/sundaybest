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
