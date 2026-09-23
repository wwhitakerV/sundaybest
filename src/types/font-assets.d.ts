/**
 * `require("*.ttf")` resolves to a Metro asset module at runtime — a number
 * (an asset ID) in development, or a `{ uri }`-shaped object depending on the
 * platform's asset resolution. `expo-font`'s `useFonts()` accepts either, so
 * this is typed as `number` to match what Metro's own asset transform
 * produces without pretending to a richer shape nothing here reads.
 */
declare module "*.ttf" {
  const assetId: number;
  // eslint-disable-next-line import/no-default-export -- an asset-module shim has no named export to offer; `import x from "*.ttf"` is the only shape Metro's own resolution supports.
  export default assetId;
}
