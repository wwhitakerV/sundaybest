# home

The Home tab, set as an editorial page on white: the masthead, then the study
under way (`FeaturedStudy`): its 16:9 artwork alone (opening the plan, which it
zooms into), a restrained label with the day opposite, the title in Canela,
today's study and minutes in Söhne, and Continue, black (grey while the next
day waits). Or, with none under way, the way to start one. Under it, the verse
of the day, open on the page.

As Home scrolls (`useStudyScroll`, `logic/study-scroll.ts`): the artwork is
held back a little (parallax) and stretches from its foot when pulled down;
the words fade as they reach the top; and a white plan bar (`StudyBar`) comes
in under the status bar as the artwork leaves, the artwork flying up into its
thumbnail (`ArtworkFlight`) and the masthead giving way to it. The bar's foot
arches inward at both sides, so the page scrolls up into a rounded window. Let
go halfway and it glides to one end. Under Reduce Motion there's no parallax,
stretch or flight; the bar simply fades in. The previous hero is in
`legacy-home-hero/`.

## Before there's a plan

**No plans of their own yet** (`onboarding`): Home is one thing to do
(`HomeOnboarding`). The day's verse sits quiet at the top (the Scripture
face's italic and its reference — no card, no actions); at the foot, under the
thumb, "Turn a sermon into daily study.", how ("Search for it by name, or paste
its link."), a field that's a button (`SermonFieldButton`, the app's search
pill) opening New Plan with its keyboard up, and "Try a sample instead" as a
quiet link when there's a sample. No hero, no verse card. The tab bar leaves
out its plus meanwhile (`useHideTabBarFab`), and the tabs take its room —
the plus arrives with the first plan. It never guesses when the sermon was
heard.

**Plans, but none under way** (for now): `StartHereHero` takes the plan hero's
place in its own frame — full width, rounded at the top, the same room to
breathe — on the brand's red (`accent`), flat, in white: "START HERE", "Turn a
sermon into daily study", Add a sermon (with a plus, `actionIcon`), and
"Search for it, or paste its link."

## Previewing Home's states

In development builds (`homePreviews`), nothing is drawn on Home for it: shake
the phone and React Native's developer menu lists Home's states with made-up
plans (`logic/home-preview.ts`, `hooks/use-home-dev-menu.ts`) — "Home: Real
data", loading, couldn't load, no plans yet, none under way, a day open, today
done, two under way — and "Home: Replay the welcome". "Start over as a new
reader", in the same menu, makes the phone a stranger to SundayBest (ADR 0035).

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
