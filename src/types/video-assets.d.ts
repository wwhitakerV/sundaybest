/**
 * `import x from "*.mp4"` resolves to a Metro asset module — an asset ID
 * number — which React Native resolves to a URL to play it from
 * (`Image.resolveAssetSource`). Typed as `number` to match what Metro's asset
 * transform produces, like the image shims beside it.
 */
declare module "*.mp4" {
  const assetId: number;
  // eslint-disable-next-line import/no-default-export -- an asset-module shim has no named export to offer; `import x from "*.mp4"` is the only shape Metro's own resolution supports.
  export default assetId;
}
