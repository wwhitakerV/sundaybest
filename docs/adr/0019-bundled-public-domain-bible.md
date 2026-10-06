# ADR 0019 — Bundled public-domain Bible text (BSB default, KJV)

- **Status:** Accepted
- **Date:** 2026-10-05
- **Deciders:** @wwhitakerv

## Context

Plan generation checks every passage it publishes, and Daily Study shows each
passage in the reader's translation. Both depended on `BIBLE_PROVIDER_URL`, a
gateway that was never built, so no real plan could be published or studied.

The NIV was the default, but it is copyrighted by Biblica: showing it needs
written permission or a licensed provider. API.Bible offers it to
non-commercial apps only, caps cached text at 30 days, and requires usage
reporting (FUMS) that conflicts with SundayBest's no-tracking rule.

## Decision

- The API bundles the **Berean Standard Bible** (public domain) and the **King
  James Version** (public domain in the US) as `api/data/bible/*.json`, with a
  `manifest.json` holding book names, checksums and the verses each translation
  omits. `src/bible/bible-store.ts` loads them once per process, validates them
  with Zod, and rejects a file whose checksum does not match.
- **BSB is the default** for new users (migration `0002_default_bsb.sql`), and
  existing NIV/ESV/NLT choices move to BSB.
- Bundled text is served **from memory**: no network call, and no
  `scripture_texts` row. The KJV's `[brackets]` (translator-supplied words) are
  removed when served; the stored text is left exactly as supplied.
- NIV, ESV and NLT remain in the contract but are offered only when a licensed
  gateway is configured (`availableTranslations`); the settings endpoint
  rejects them otherwise.
- Generation requires each passage to have text in every bundled translation,
  and the full verse range in at least one, so a plan never points Daily Study
  at a verse its default translation omits.

## Consequences

### Good

- Real plans can be generated and studied with no third-party Bible service.
- Daily Study's Scripture is effectively instant, and offline caching is allowed.
- No licensing exposure for launch.

### Bad

- About 8 MB of JSON lives in the repo and in each API process's memory.
- Users who prefer NIV, ESV or NLT cannot choose them until one is licensed
  (see `docs/SETUP_CHECKLIST.md`).
- The source of each export must be recorded in `api/data/bible/README.md`.
