# Bundled Bible text

Read by `src/bible/bible-store.ts` once per process. See
[ADR 0019](../../../docs/adr/0019-bundled-public-domain-bible.md).

| File | Translation | License | Source |
| --- | --- | --- | --- |
| `bsb.json` | Berean Standard Bible | Public domain (dedicated by its publisher) | _Not yet recorded_ |
| `kjv.json` | King James Version | Public domain in the US | _Not yet recorded_ |
| `manifest.json` | Book names and aliases, checksums, omitted verses | — | — |

## Rules

- Do not edit a translation file by hand. Replace it with a new export and
  update its `contentSha256`, `version` and counts in `manifest.json`; the
  store refuses a file whose checksum does not match.
- Copyrighted translations (NIV, ESV, NLT) are never bundled. They come only
  from a licensed gateway set with `BIBLE_PROVIDER_URL`.
- Empty strings are verses the translation omits (the BSB omits 16). They stay
  empty here; lookups report them as omissions.
