import { useEffect, useState } from "react";

const TICK_MS = 32;

type Reading = { run: string | null; elapsedMs: number };
const IDLE: Reading = { run: null, elapsedMs: 0 };

/**
 * Milliseconds since `run` last became the current run (e.g. which card is
 * on stage), ticking ~30 times a second; 0 when `run` is null. A new run —
 * even the same card again on the story's next loop — always starts from 0.
 */
export function useSceneClock(run: string | null): number {
  const [reading, setReading] = useState<Reading>(IDLE);

  useEffect(() => {
    if (run === null) return;
    const startedAt = Date.now();
    const interval = setInterval(() => {
      setReading({ run, elapsedMs: Date.now() - startedAt });
    }, TICK_MS);
    return () => {
      clearInterval(interval);
      setReading(IDLE);
    };
  }, [run]);

  // Until this run's first tick, an old run's reading must not leak through.
  return reading.run === run ? reading.elapsedMs : 0;
}
