/**
 * Where a card's illustration goes, as shares of the card — measured off the
 * mockup — so it lands the same on any phone: its width, its own shape, how
 * far in from the right edge (negative hangs it over, clipped), and whether
 * it's centred top to bottom or sits on the bottom edge.
 */
export type ArtPlacement = {
  /** Its width, as a share of the card's (0–1). */
  share: number;
  /** Its own width over its height. */
  aspect: number;
  /** In from the card's right edge, as a share of the card's width; negative hangs it over. */
  right: number;
  anchor: "centre" | "bottom";
};

/** The art's frame in points, in a card of `box`'s measured size. */
export function getArtFrame(
  box: { width: number; height: number },
  { share, aspect, right, anchor }: ArtPlacement,
): { width: number; height: number; right: number; top: number } {
  const width = box.width * share;
  const height = width / aspect;
  const top = anchor === "bottom" ? box.height - height : (box.height - height) / 2;
  return { width, height, right: box.width * right, top };
}

/**
 * The largest an illustration can be in a measured space: its `share` of the
 * space's width, keeping its own shape (`aspect`, width over height) — or,
 * where that's too tall, the space's full height — then `extra` points wider
 * (or narrower, negative), still keeping its shape. Nothing until measured.
 */
export function fitArt(
  space: { width: number; height: number },
  { share, aspect, extra = 0 }: { share: number; aspect: number; extra?: number },
): { width: number; height: number } {
  const fitted = Math.min(space.width * share, space.height * aspect);
  const width = fitted > 0 ? Math.max(0, fitted + extra) : 0;
  return { width, height: width / aspect };
}
