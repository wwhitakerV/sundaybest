/** Types owned by this slice. Anything another slice needs must be re-exported from `index.ts`. */

/** The slice's domain shape — what the rest of the slice works with. */
export type Example = {
  id: string;
  title: string;
};
