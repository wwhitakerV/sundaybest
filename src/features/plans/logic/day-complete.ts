import { addDays } from "@/utils/dates/addDays";
import { formatClockTime } from "@/utils/time/formatClockTime";

/** A key verse reads whole in four lines of the Scripture face: about this many characters. */
const KEY_VERSE_CHARACTERS = 90;

/**
 * The day's key verse, as Progress picks it: the first that reads whole in
 * four lines, or — when none is that short — the shortest. Never cut.
 */
export function pickKeyVerse(verses: readonly { number: number; text: string }[]): string | null {
  const fits = verses.find((verse) => verse.text.trim().length <= KEY_VERSE_CHARACTERS);
  if (fits) return fits.text.trim();
  const shortest = [...verses].sort((a, b) => a.text.length - b.text.length)[0];
  return shortest ? shortest.text.trim() : null;
}

/**
 * When the next day opens, as a fact — "Opens tomorrow", "Opens Friday" — and
 * the daily reminder's time beside it only when one is on, never blended in.
 */
export function describeUpNext(
  opensOn: string | null,
  today: string,
  reminder: { enabled: boolean; time: string } | null,
  twentyFourHour = false,
): string {
  const when =
    opensOn === null || opensOn <= today
      ? "Open now"
      : opensOn === addDays(today, 1)
        ? "Opens tomorrow"
        : `Opens ${new Date(`${opensOn}T00:00:00.000Z`).toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" })}`;
  return reminder?.enabled
    ? `${when} · Reminder at ${formatClockTime(reminder.time, { twentyFourHour })}`
    : when;
}

/** What the Quick Check showed was remembered: "You remembered 8 of 10". */
export function describeRemembered(correct: number, total: number): string {
  return `You remembered ${correct} of ${total}`;
}
