import { useEffect, useState } from "react";
import { AppState } from "react-native";

const MS_PER_MINUTE = 60_000;

const untilNextMinute = (now: number) => MS_PER_MINUTE - (now % MS_PER_MINUTE);

/**
 * The time now, turning over on each minute's boundary — never a moment
 * after — and catching up when the app comes back to the front, the phone's
 * clock having moved on while it slept.
 */
export function useMinuteClock(): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      setNow(new Date());
      timer = setTimeout(tick, untilNextMinute(Date.now()));
    };
    timer = setTimeout(tick, untilNextMinute(Date.now()));
    const foreground = AppState.addEventListener("change", (state) => {
      if (state !== "active") return;
      clearTimeout(timer);
      tick();
    });
    return () => {
      clearTimeout(timer);
      foreground.remove();
    };
  }, []);

  return now;
}
