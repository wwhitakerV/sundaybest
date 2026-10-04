/**
 * The device's current IANA timezone, for server-side local-day rules.
 *
 * `Intl` is available in Hermes. Falling back to UTC keeps the request valid
 * if a platform ever returns an empty/unknown zone instead of inventing one.
 */
export function getDeviceTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}
