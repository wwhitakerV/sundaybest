/**
 * The 99's world, in the board's own units — a board `BOARD` wide and tall,
 * whatever the screen: a slim band at the top where the saved gather, the
 * field below where the flock is, a gate on the line between, and the wolf.
 * Its parts move in `flock-sheep`, `flock-wolf`, `flock-call` and
 * `flock-step`: worklets, stepped on the UI thread at a fixed rate, so one
 * day's game is the same game on every phone.
 *
 * A worklet calls only worklets defined above it in its file (or imported).
 * A worklet's closure is captured in file order, so one calling another
 * defined further down finds nothing on the UI thread — and an error there
 * aborts the app.
 */

/** The board, in its own units: the screen draws it to fit. */
export const BOARD = { width: 1000, height: 1300 };
/** The band where the saved gather: the top fifth. The field is everything below its line. */
export const BAND = 260;

/** The gate on the band's line: this wide, this thick. */
export const GATE = { width: 120, thickness: 14 };

/** The flock: how many, how big, and how they hop. */
export const SHEEP = {
  count: 20,
  radius: 13,
  /** A hop's length, at an ordinary sheep's speed. */
  hop: 13,
  /** How long a sheep waits between hops, at most and at least, before its own speed. */
  hopEvery: { most: 460, least: 200 },
  /** How near the wolf must be before a sheep runs. */
  fleeWithin: 170,
  /** How far a sheep looks for others to follow. */
  followWithin: 90,
};

/** The wolf: its size, its speeds, how fast it settles on one sheep, and how near the gate it may come. */
export const WOLF = {
  radius: 24,
  /** Weighing up a group, it slows; after a sheep alone, it goes faster; locked on, faster still. */
  evaluating: 0.04,
  isolated: 0.1,
  locked: 0.19,
  /** How long it takes to lock on to the sheep it keeps choosing. */
  lockMs: 1500,
  /** How near the gate's middle it may never come: the gate is safe. */
  gateGuard: 210,
  /** How far it sees. */
  sight: 620,
};

/** A call: how fast it grows to full, how far its waves reach, and how often they go out. */
export const CALL = {
  growMs: 2000,
  reach: { least: 140, most: 600 },
  pulseEvery: { slowest: 380, fastest: 90 },
  /** How long a wave takes to spread and fade. */
  ringMs: 700,
};

/** The countdown before the flock and the wolf move. */
export const COUNTDOWN_MS = 3000;
/** The simulation's tick: always this long, however fast the screen draws. */
export const STEP_MS = 1000 / 60;

/** Where a sheep is: in the field, saved through the gate, or taken by the wolf. */
export const SHEEP_STATE = { field: 0, saved: 1, taken: 2 } as const;

type Sheep = {
  x: number;
  y: number;
  state: number;
  /** Its own nature, fixed for the day: how quick, how much its own, how drawn to the gate. */
  speed: number;
  independence: number;
  drift: number;
  /** When it next hops, in play time. */
  nextHopAt: number;
  /** Its place in the band, once saved. */
  slot: number;
};

type Wolf = {
  x: number;
  y: number;
  /** The way it's facing, in radians. */
  heading: number;
  /** The sheep it's weighing up most, or -1; and how settled it is on it, 0 (a wide V) to 1 (locked). */
  target: number;
  focus: number;
};

type Call = {
  active: boolean;
  x: number;
  y: number;
  startedAt: number;
  nextPulseAt: number;
};
type Ring = { x: number; y: number; bornAt: number; reach: number };
type Phase = "gate" | "countdown" | "play" | "over";

/** The whole game at a moment — one object, kept in a shared value and changed in place each tick. */
export type FlockGame = {
  phase: Phase;
  /** Play time, in ms, from the moment everything moves. */
  time: number;
  /** How far into the countdown. */
  countdown: number;
  /** Time not yet stepped, carried to the next frame. */
  carry: number;
  seed: number;
  sheep: Sheep[];
  wolf: Wolf;
  /** The gate's middle along the band's line. */
  gateX: number;
  call: Call;
  rings: Ring[];
  saved: number;
  taken: number;
  /** Counters the screen watches for its haptics: waves sent, locks made. */
  pulses: number;
  locks: number;
};
