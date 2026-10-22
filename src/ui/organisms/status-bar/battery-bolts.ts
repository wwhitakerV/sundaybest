/**
 * The bolt, drawn for the battery rather than taken from an icon set: long,
 * sharp tips on thick arms and only a short step across its middle — bold
 * enough to read at a glance, never a zigzag. 7 × 12 in its own units.
 */
export const BOLT_PATH = "M7 0 L1 6.4 L2.8 6.4 L0 12 L6 5.6 L4.2 5.6 Z";
/**
 * The same bolt for a dark background, where a dark bolt in white paint reads
 * thinner (the light spills into it): its arms about 0.55pt heavier — the outer
 * elbows out, the inner notches in, the steps across its middle as long — and
 * its tips exactly where `BOLT_PATH`'s are, so it's never longer, only firmer.
 */
export const BOLT_PATH_ON_DARK = "M7 0 L0.5 6.4 L2.3 6.4 L0 12 L6.5 5.6 L4.7 5.6 Z";
const BOLT_DRAWN = { width: 7, height: 12 };
/**
 * The bolts' places along the stroke while it charges: this many, this tall,
 * `step` apart (left edge to left edge), the row centred on the stroke.
 */
const BOLTS = { count: 3, height: 8, step: 9.1 };
/** A bolt in its place shows once this much of its width is inside the paint. */
const SHOWN_WITHIN = 0.55;
/** The one smaller bolt's size when the paint is too short for a bolt in its place. */
const SMALL_BOLT = { least: 4, most: 6 };
/** Where the brush's body is solid, as shares of its length — its dry ends either side. */
const SOLID = { start: 0.1, end: 0.87 };

const widthAt = (height: number) => (BOLT_DRAWN.width * height) / BOLT_DRAWN.height;

const place = (x: number, height: number, strokeHeight: number) =>
  `translate(${x} ${(strokeHeight - height) / 2}) scale(${height / BOLT_DRAWN.height})`;

/**
 * Where the charging bolts are drawn — always inside the paint, as white cut
 * out of it, never over the faint stroke: one, two or three as the paint
 * mostly reaches each of their places (`SHOWN_WITHIN`), `step` apart and
 * centred on the paint that's there, so the battery fills up bolt by bolt; while the paint reaches none of them, one smaller bolt in the middle
 * of what paint there is, so charging always shows. `paintEnd` is where the
 * charge's solid body ends; `dab` says the paint is the whole stroke drawn
 * short, `charge` of its length.
 */
export function chargingBolts(
  charge: number,
  { width, height }: { width: number; height: number },
  { dab, paintEnd }: { dab: boolean; paintEnd: number },
): string[] {
  const full = widthAt(BOLTS.height);
  const paintStart = (dab ? charge * width : width) * SOLID.start;
  const paintMiddle = (paintStart + paintEnd) / 2;
  // How many: as many of the three places as the paint has mostly reached.
  const rowStart = (width - ((BOLTS.count - 1) * BOLTS.step + full)) / 2;
  const shown = Array.from(
    { length: BOLTS.count },
    (_, index) => rowStart + index * BOLTS.step,
  ).filter((x) => x + full * SHOWN_WITHIN <= paintEnd).length;
  if (shown > 0) {
    // Where: that many, `step` apart as ever, centred on the paint that's there.
    const firstX = paintMiddle - ((shown - 1) * BOLTS.step + full) / 2;
    return Array.from({ length: shown }, (_, index) =>
      place(firstX + index * BOLTS.step, BOLTS.height, height),
    );
  }

  const room = Math.max(paintEnd - paintStart, 0);
  const small = Math.min(
    Math.max((room * BOLT_DRAWN.height) / BOLT_DRAWN.width, SMALL_BOLT.least),
    SMALL_BOLT.most,
  );
  return [place(paintMiddle - widthAt(small) / 2, small, height)];
}

/** Where a dab's solid body ends: the whole stroke drawn `charge` of its length. */
export function dabSolidEnd(charge: number, width: number): number {
  return charge * width * SOLID.end;
}
