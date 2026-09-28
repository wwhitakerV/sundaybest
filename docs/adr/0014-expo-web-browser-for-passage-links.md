# ADR 0014 — `expo-web-browser` opens passage links over the app

- **Status:** Accepted
- **Date:** 2026-09-28
- **Deciders:** @wwhitakerv

## Context

Theology exams link each question to its passages on Bible Gateway (the
content's own `sources[].url`). The spec forbids showing passage text in the
app, so the links are how a learner reads the text in context — mid-exam, and
from the Understand why page.

`expo-linking` (already installed) hands a URL to the Safari app: the user
leaves SundayBest, and since attempts live only in memory until the database
lands, iOS closing the app in the background would lose the attempt in
progress.

## Decision

We add `expo-web-browser` (Expo SDK 57's `~57.0.3`, MIT, no dependencies of its
own) and open passage links in `SFSafariViewController`, presented as a page
sheet over the exam. It is a side-effect SDK, so it is imported only in
`src/core/links/open-passage-link.ts` — lint enforces this — which:

- opens only `https://www.biblegateway.com/…` (no other scheme, host, port, or
  credentials), checked again here even though the content is validated at
  load;
- accepts a URL only in canonical form — its parsed `href` must equal the
  string exactly — because the check parses with WHATWG rules while iOS opens
  the raw string with `URL(string:)`, and the two read strings like
  `https://www.biblegateway.com\@evil.com/` as different hosts;
- never throws, and never logs the URL.

Its config plugin is Android-only (and inert without its
`experimentalLauncherActivity` option), so `app.config.ts` is unchanged.

## Consequences

### Good

- The passage slides up over the exam and "Done" returns to the same question
  with nothing lost; the app never leaves the foreground.
- Real Safari: Reader, text size, and the user's content blockers.

### Bad

- A native module: **the iOS development build must be rebuilt**
  (`npx expo run:ios`, or a new EAS development build) before links open.
- The in-app sheet does not share cookies with the Safari app. Irrelevant here.

### Neutral

- Bible Gateway sees the request when a user taps a link, as for any page
  visit. Recorded in the privacy data inventory.

## Alternatives considered

| Option                             | Why not                                                                    |
| ---------------------------------- | -------------------------------------------------------------------------- |
| `expo-linking` into the Safari app | Leaves the app; an in-memory attempt can be lost if iOS closes SundayBest. |
| Show passage text in the app       | Forbidden by the brief (no unlicensed full passage text).                  |
| A WebView                          | A new dependency with more surface, and a worse reader than Safari's own.  |

## Removal

Swap `openBrowserAsync` for `Linking.openURL` in
`src/core/links/open-passage-link.ts`, `npm uninstall expo-web-browser`,
remove it from the restricted list in `eslint.config.js` and the mock in
`tests/setup/jest.setup.ts`, and rebuild. Nothing else imports it.

## Verification

`grep -rn "expo-web-browser" src` shows only `src/core/links`.
`eslint.config.js` restricts the import to `src/core`. `npm audit` stays at
zero.
