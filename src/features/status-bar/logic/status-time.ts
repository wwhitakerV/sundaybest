const pad = (value: number) => String(value).padStart(2, "0");

/**
 * The time as the status bar writes it: on a 12-hour clock the hour bare and
 * no AM or PM, as iOS's bar does ("1", "03"); on a 24-hour clock in full
 * ("13", "03", midnight "00"). `spoken` is how VoiceOver reads it.
 */
export function describeStatusTime(now: Date, twentyFourHour: boolean) {
  const hour = now.getHours();
  const minutes = pad(now.getMinutes());
  if (twentyFourHour) {
    const hours = pad(hour);
    return { hours, minutes, spoken: `${hours}:${minutes}` };
  }
  const hours = String(hour % 12 === 0 ? 12 : hour % 12);
  return { hours, minutes, spoken: `${hours}:${minutes} ${hour < 12 ? "AM" : "PM"}` };
}
