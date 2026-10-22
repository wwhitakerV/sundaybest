# ADR 0035 — "Start over as a new reader", from the developer menu

- **Status:** Accepted
- **Date:** 2026-10-20
- **Deciders:** @wwhitakerv

## Context

The first-time experience — the launch intro, Home's welcome writing itself
out, an empty Home and our sample plans — has to be walked again and again on a
real iPhone, exactly as a stranger meets it, with no demo control on any
screen. It couldn't be: the install's identity lives in the keychain
(`development.installationId`, or `attestation.keyId` and
`session.refreshToken`), which iOS keeps after the app is deleted, so a
reinstall came back as the same reader with their plans. Wiping the server's
database was no answer either: it holds the shared library a newcomer should
meet — the sample plans, generated plans, Scripture, transcripts.

## Decision

- **An item in React Native's developer menu** (shake the phone):
  "Start over as a new reader". `DevSettings.addMenuItem` is core React
  Native — no new package — and is wrapped in `src/core/dev-menu/dev-menu.ts`,
  which adds nothing outside a development build run in debug.
- **What it does, in order:** forgets the identity keys and the offline
  cache's user (`security/session/forget-identity.ts`); empties every reader
  table on the phone in one transaction — the offline cache, the outbox, what
  was written, liked, shown and seen (`storage/device-wipe.ts`); cancels
  SundayBest's scheduled reminders; reloads the app. The next launch is a new
  anonymous reader to the server.
- **Kept:** the database's key (the database reopens, empty), the server and
  everything on it (the old reader's rows are orphaned, harmless), and iOS's
  notification permission — which only deleting the app resets.
- **Home's state previews move to the same menu** ("Home: …", and "Home:
  Replay the welcome"), so no screen ever draws a development control.

## Alternatives

- **Wipe the server database.** Destroys the shared library, and doesn't
  forget the phone's identity.
- **Drop the keychain identity on a fresh install** (a marker outside the
  keychain). Makes delete-and-reinstall a true first run, but in development
  every reinstall is a rebuild, and for real readers it's a product decision —
  whether reinstalling brings plans back — not made yet.
- **`expo-dev-menu`'s `registerDevMenuItems`.** The same, at the cost of a new
  native package.
- **A button on Home.** What this replaces: it put a demo control on the screen.
