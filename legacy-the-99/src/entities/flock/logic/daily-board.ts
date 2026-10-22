import { mix, nextRandom } from "./flock-geometry";
import { BAND, BOARD, SHEEP, SHEEP_STATE, WOLF, type FlockGame } from "./flock-rules";

/** The first day of The 99: Daily 001. */
const FIRST_DAY = Date.UTC(2026, 9, 22);
const DAY_MS = 24 * 60 * 60 * 1000;
/** The flock starts spread over the field, kept this far from its edges. */
const FIELD_MARGIN = 60;
/** The wolf starts at least this far from the nearest sheep. */
const WOLF_CLEAR = 220;
/** How many places the day offers the wolf, keeping the first clear of the flock. */
const WOLF_TRIES = 24;

/** Which day's game a calendar date ("2026-10-22") is: 1, 2, 3… */
export function dailyNumber(isoDate: string): number {
  const [year, month, day] = isoDate.split("-").map(Number);
  const at = Date.UTC(year ?? 2026, (month ?? 1) - 1, day ?? 1);
  return Math.max(1, Math.floor((at - FIRST_DAY) / DAY_MS) + 1);
}

/** How a day's number is written: "DAILY 001". */
export function formatDaily(number: number): string {
  return `DAILY ${String(number).padStart(3, "0")}`;
}

/**
 * A day's game, before it starts: the flock spread over the field, standing
 * still, each sheep with its own nature for the day — quick or slow, its own
 * or a follower, drawn to the gate or not; the wolf at a place the day picks,
 * clear of the flock; the gate in the middle of its line, to be placed.
 * Everyone's board is the same on the same day.
 */
export function dailyBoard(number: number): FlockGame {
  let seed = (number * 2654435761) >>> 0;
  const draw = () => {
    const next = nextRandom(seed);
    seed = next.state;
    return next.value;
  };
  const top = BAND + FIELD_MARGIN;
  const sheep = Array.from({ length: SHEEP.count }, () => ({
    x: mix(FIELD_MARGIN, BOARD.width - FIELD_MARGIN, draw()),
    y: mix(top, BOARD.height - FIELD_MARGIN, draw()),
    state: SHEEP_STATE.field,
    speed: mix(0.6, 1.4, draw()),
    independence: draw(),
    drift: mix(0.15, 1, draw()),
    nextHopAt: draw() * 400,
    slot: -1,
  }));
  let wolf = { x: BOARD.width / 2, y: BOARD.height - WOLF.radius * 2 };
  for (let tries = 0; tries < WOLF_TRIES; tries += 1) {
    const place = {
      x: mix(WOLF.radius * 2, BOARD.width - WOLF.radius * 2, draw()),
      y: mix(BAND + WOLF.gateGuard, BOARD.height - WOLF.radius * 2, draw()),
    };
    const nearest = Math.min(...sheep.map((one) => Math.hypot(one.x - place.x, one.y - place.y)));
    wolf = place;
    if (nearest > WOLF_CLEAR) break;
  }
  return {
    phase: "gate",
    time: 0,
    countdown: 0,
    carry: 0,
    seed,
    sheep,
    wolf: { ...wolf, heading: -Math.PI / 2, target: -1, focus: 0 },
    gateX: BOARD.width / 2,
    call: { active: false, x: 0, y: 0, startedAt: 0, nextPulseAt: 0 },
    rings: [],
    saved: 0,
    taken: 0,
    pulses: 0,
    locks: 0,
  };
}
