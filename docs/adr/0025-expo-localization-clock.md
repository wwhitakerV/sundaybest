# ADR 0025 — The iPhone's 12/24-hour clock, through expo-localization

- **Status:** Accepted
- **Date:** 2026-10-07
- **Deciders:** @wwhitakerv

## Context

Daily reminder shows its time twice: on a pill, and on the time wheel the pill
opens. The wheel is iOS's own `UIDatePicker`, which follows the iPhone's
12/24-hour setting (Settings › General › Date & Time › 24-Hour Time). The pill
was formatted in JavaScript, always as 12-hour ("3:04 PM"), so on an iPhone set
to 24-hour the two disagreed ("15 04" on the wheel). The reader asked for both
to follow iOS.

## Decision

Read the setting with `expo-localization` (SDK-matched, installed with
`npx expo install`): `getCalendars()[0].uses24hourClock`. It is wrapped in
`src/core/localization` (`usesTwentyFourHourClock()`), as every native SDK is,
and the pill formats with it: "15:04" on a 24-hour iPhone, "3:04 PM" otherwise.
When the setting can't be read (`null`), the pill keeps the 12-hour format it
has always used.

### Rejected

- **JavaScript's `Intl` (Hermes).** It formats by the region's default, and
  does not reliably see the 24-Hour Time switch, which overrides the region —
  so it would agree with the wheel only some of the time.
- **Always 12-hour, wheel forced to a 12-hour locale.** Simple, but it's not
  what iOS does, and not what was asked for.
- **Always 24-hour.** Same objection.

## Consequences

- A native module: it ships with a new build, not an OTA update. The
  development client needs rebuilding.
- iOS reports the setting once per launch: a change in Settings shows after the
  app is next opened, as Expo documents.
- Privacy: nothing leaves the device. The setting is read on the phone and only
  decides how a time is written.
- No config plugin is added: the plugin only configures RTL and supported
  locales, neither of which the app uses, so `app.config.ts` is unchanged.

## Removing it

Delete `src/core/localization`, have the pill call `formatClockTime` alone, and
uninstall the package. The pill goes back to 12-hour everywhere.
