/**
 * The plain geometry a stone is carved with: the cells its facets are cut
 * into, the seams between them, irregular blobs and wandering lines. Pure:
 * every random number comes from the caller, so a seed always carves the
 * same stone.
 */

export type Point = { x: number; y: number };
export type Box = { x: number; y: number; width: number; height: number };

/** `polygon` cut back to the side of the line through `at` that `toward` points away from. */
function cutBy(polygon: Point[], at: Point, toward: Point): Point[] {
  const side = (p: Point) => (p.x - at.x) * toward.x + (p.y - at.y) * toward.y;
  const kept: Point[] = [];
  polygon.forEach((p, i) => {
    const q = polygon[(i + 1) % polygon.length] ?? p;
    const sp = side(p);
    const sq = side(q);
    if (sp <= 0) kept.push(p);
    if (sp <= 0 !== sq <= 0) {
      const t = sp / (sp - sq);
      kept.push({ x: p.x + (q.x - p.x) * t, y: p.y + (q.y - p.y) * t });
    }
  });
  return kept;
}

/** Each of `sites`' cells in `box`: the region nearer it than any other site (a Voronoi diagram). */
export function cellsOf(sites: readonly Point[], box: Box): Point[][] {
  const frame: Point[] = [
    { x: box.x, y: box.y },
    { x: box.x + box.width, y: box.y },
    { x: box.x + box.width, y: box.y + box.height },
    { x: box.x, y: box.y + box.height },
  ];
  return sites.map((site) =>
    sites.reduce(
      (cell, other) =>
        other === site
          ? cell
          : cutBy(
              cell,
              { x: (site.x + other.x) / 2, y: (site.y + other.y) / 2 },
              { x: other.x - site.x, y: other.y - site.y },
            ),
      frame,
    ),
  );
}

/** The edges two cells share — not the frame's — each once, as its two ends. */
export function seamsOf(cells: readonly Point[][], box: Box): [Point, Point][] {
  const onFrame = (p: Point, q: Point) =>
    (Math.abs(p.x - box.x) < 1e-6 && Math.abs(q.x - box.x) < 1e-6) ||
    (Math.abs(p.y - box.y) < 1e-6 && Math.abs(q.y - box.y) < 1e-6) ||
    (Math.abs(p.x - box.x - box.width) < 1e-6 && Math.abs(q.x - box.x - box.width) < 1e-6) ||
    (Math.abs(p.y - box.y - box.height) < 1e-6 && Math.abs(q.y - box.y - box.height) < 1e-6);
  const seen = new Set<string>();
  const seams: [Point, Point][] = [];
  for (const cell of cells) {
    cell.forEach((p, i) => {
      const q = cell[(i + 1) % cell.length] ?? p;
      if (onFrame(p, q) || Math.hypot(q.x - p.x, q.y - p.y) < 1e-4) return;
      const key = `${((p.x + q.x) / 2).toFixed(4)},${((p.y + q.y) / 2).toFixed(4)}`;
      if (seen.has(key)) return;
      seen.add(key);
      seams.push([p, q]);
    });
  }
  return seams;
}

/** An irregular blob round `centre`, about `r` across its middle, its edge lumpy by up to `lumps` of it. */
export function blobOf(centre: Point, r: number, lumps: number, random: () => number): Point[] {
  const waves = [2, 3, 5].map((w) => ({ w, phase: random() * Math.PI * 2, a: random() }));
  const total = waves.reduce((sum, wave) => sum + wave.a, 0) || 1;
  return Array.from({ length: 24 }, (_, i) => {
    const turn = (i / 24) * Math.PI * 2;
    const swell = waves.reduce(
      (sum, wave) => sum + wave.a * Math.sin(turn * wave.w + wave.phase),
      0,
    );
    const reach = r * (1 + (swell / total) * lumps);
    return { x: centre.x + Math.cos(turn) * reach, y: centre.y + Math.sin(turn) * reach };
  });
}

export type Walk = { joints: number; wander: number; jitter: number };

/**
 * A line `length` long through `centre`, setting off along `heading`
 * (radians), that wanders as it runs — turning a little at each of its
 * `joints`, and jittering — never straight, never a zigzag: a fracture's.
 */
export function walkOf(
  centre: Point,
  heading: number,
  length: number,
  { joints, wander, jitter }: Walk,
  random: () => number,
): Point[] {
  const stride = length / (joints - 1);
  let turn = heading;
  const line: Point[] = [
    { x: centre.x - (Math.cos(turn) * length) / 2, y: centre.y - (Math.sin(turn) * length) / 2 },
  ];
  for (let k = 1; k < joints; k += 1) {
    turn += (random() - 0.5) * wander;
    const last = line[k - 1] ?? centre;
    const off = (random() - 0.5) * jitter * 2;
    line.push({
      x: last.x + Math.cos(turn) * stride - Math.sin(turn) * off,
      y: last.y + Math.sin(turn) * stride + Math.cos(turn) * off,
    });
  }
  return line;
}
