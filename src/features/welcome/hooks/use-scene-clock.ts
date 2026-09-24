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
 */
export function useSceneClock(run: string | null, quietMs = 0): number {
  const [reading, setReading] = useState<Reading>(IDLE);

  useEffect(() => {
    if (run === null) return;
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
      setReading(IDLE);
    };
  }, [run, quietMs]);

  // Until this run's first tick, an old run's reading must not leak through.
  return reading.run === run ? reading.elapsedMs : 0;
}
