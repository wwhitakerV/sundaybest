# home

The Home tab: the masthead, the plan under way (`ActivePlanHero`, and the bar
that takes its place as it scrolls away) or the way to start one, and under
it the verse of the day.

## The verse of the day

Under the plan card — or "Start here", before there's a plan — set on the page
itself, with no card or edge round it and room above it (`VerseCard`):
"VERSE OF THE DAY" in the red tracked mono, the verse centred in the Scripture
face, its reference in red with the reader's translation ("Colossians 3:13 ·
BSB") and the day it's for beneath. Then, centred, a heart and Share
(`VerseActions`, `RoundIconButton`), and last SundayBest's line for the day as
an epigraph: a short red rule over it in the Scripture italic (`VerseCaption`).
A long passage shows its key verse, whole (`pickKeyVerse`,
`@/entities/scripture`).

No paint on it: on Home the wordmark's stroke is the page's one, so it stays
the brand's mark.

- **Sharing**: the verse itself is a button, as is Share; either opens iOS's
  share sheet (`@/core/sharing`) with a picture of the verse and its words.
- **The picture** is `VerseShareCard`: the verse, its reference and day at 4:5
  on the paper, signed with the painted wordmark, drawn well off the screen and
  hidden from VoiceOver; only its snapshot is seen.
- **The words** are the whole passage, quoted, then "Colossians 3:13 (BSB)".
- **The translation** is the reader's when the app carries its words (BSB,
  KJV); any other shows the BSB.
- **Liking** is kept on this phone only (`liked_verses`, `useLikedVerse` in
  `@/core/storage`), shown at once and put back if the phone can't keep it.
  A like gives a selection haptic.

**Its data** is `data/daily-verses.json`, built by `npm run build:verses` from
the list in `scripts/daily-verses/daily-verses.json` (a date, a caption, a
reference for each day) and the Bibles in `api/data/bible`. It's in the app, so
the card is there at once, with no network. A test fails until it's rebuilt
after the list changes. Past the list's last day it starts again from the top
(`pickDailyVerse`). A day with two references shows its first; the build lists
those.
