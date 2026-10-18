# ADR 0031 — The paint movie is the only launch intro

- **Status:** Accepted
- **Date:** 2026-10-17
- **Deciders:** @wwhitakerv
- **Supersedes:** ADRs 0026–0029 (now in `legacy-intro-and-assets/docs/adr/`)

## Context

The launch intro went through five versions: the pool drawn live (0026), the
water drawn live (0027), the water as a movie (0028), the pool in water as a
movie (0029) and the paint movie (0030). They were kept one switch apart
(`launch-colors.json`'s `intro`), so the slice, the theme, the arrival system,
the render scripts and `app.config.ts` all carried code for every one of them.
The paint movie is the one the app ships, and the others are done with.

## Decision

- **Only the paint movie is supported.** The intro switch is gone. `LaunchIntro`
  plays the paint movie, or the Reduce Motion fade.
- **The old intros are retired to one folder, `legacy-intro-and-assets/`**, at
  the repo root, mirroring their original paths: their code, tests, movies,
  prototypes and ADRs. Files that were trimmed rather than moved have a copy
  there as they were. Nothing imports from it, and `tsconfig.json`, ESLint and
  Prettier ignore it; Jest and knip never look there.
- **What went with them:**
  - `launch-colors.json` holds one colour, `page`; `launchInk` and the water's
    glass colours are gone from the theme.
  - `Arrive` no longer follows a cover's edge down the page (the water's drain);
    pieces always arrive in the cascade.
  - The movie clock's `follow`, the live clock and the water movie are gone.
  - `npm run render:intro` films only the paint prototype.
  - `app.config.ts` reads the launch screen's colour straight from `page`.

## Consequences

- To delete the old intros: remove `legacy-intro-and-assets/` and its entries in
  `tsconfig.json`'s `exclude`, ESLint's `globalIgnores` and `.prettierignore`.
  Nothing else changes.
- Bringing an old intro back means restoring it from that folder (or git) and
  its switch with it.
