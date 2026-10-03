import { useEffect, useState } from "react";

const TICK_MS = 32;

type Reading = { run: string | null; elapsedMs: number };
const IDLE: Reading = { run: null, elapsedMs: 0 };

/**
 * Milliseconds since `run` last became the current run (e.g. which card is
 * on stage); 0 when `run` is null. A new run — even the same card again on
 * the story's next loop — always starts from 0.
 *
 * It stays quiet for the first `quietMs` (reading 0), then ticks ~30 times a
 * second. The quiet start is for the cards' glide onto the stage: nothing
 * reads the clock then, and a re-render every tick would compete with the
 * animation for the main thread.
 *
 * `frozen` (the screen being left) stops it where it is, so nothing re-renders
 * under what arrives over it. A story that's been left plays again only by
 * mounting afresh.
 */
export function useSceneClock(run: string | null, quietMs = 0, frozen = false): number {
  const [reading, setReading] = useState<Reading>(IDLE);

  // A run's reading goes with it, so the same card on the next loop starts from 0.
  useEffect(() => {
    if (run === null) return;
    return () => setReading(IDLE);
  }, [run]);

  useEffect(() => {
    if (run === null || frozen) return;
    const startedAt = Date.now();
    const tick = () => setReading({ run, elapsedMs: Date.now() - startedAt });
    let interval: ReturnType<typeof setInterval> | undefined;
    const quiet = setTimeout(() => {
      tick();
      interval = setInterval(tick, TICK_MS);
    }, quietMs);
    return () => {
      clearTimeout(quiet);
      clearInterval(interval);
    };
  }, [run, quietMs, frozen]);

  // Until this run's first tick, an old run's reading must not leak through.
  return reading.run === run ? reading.elapsedMs : 0;
}
