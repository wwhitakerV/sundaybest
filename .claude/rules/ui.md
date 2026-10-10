---
paths:
  - "src/ui/**"
  - "src/features/*/components/**"
  - "src/features/*/screens/**"
  - "src/theme/**"
---

# UI rules

## Structure

- One component per file, named after the file (`PascalCase.tsx`). Its test
  mirrors the path under `tests/` (`tests/ui/organisms/Screen.test.tsx`).
- `src/ui` is sorted atomically: `typography/`, `atoms/`, `molecules/`,
  `organisms/` (see `src/ui/README.md` for what goes where). A part with private
  hooks keeps its own folder inside one (`organisms/tab-bar/`); a small system
  that isn't one component sits beside them (`burst/`, `header-entrance/`).
- 250 lines a file at most (lint: `max-lines`). A long render becomes named components, not
  one long block of unnamed JSX.
- `src/ui/` is generic: if it could not appear unchanged in a different app, it
  belongs in the feature slice. It never knows an app route: a control that
  navigates takes what it does as a prop (the tab bar's `fab`).
- A `ui` component never imports `features`, `core`, or `app`. Data and callbacks
  arrive as props.

## Every component

- Accepts and forwards **`testID`**. Every interactive element has one, and so
  does anything a test needs to find. Put it on the outermost element the caller
  would target.
- Reads colour from `useTheme()`. **No hardcoded colour** — both a light and a
  dark value must exist for every token. Lint rejects hex, `rgb()`/`rgba()` and
  `hsl()`/`hsla()` literals outside `src/theme` and the mock data.
- Takes spacing, corners, and control heights from `space`, `radius`, and
  `controlHeight` (`import { space } from "@/theme"`), and a card's shell from
  `Card`. A number off the scales is a named constant with its reason (ADR
  0016).
- Draws text only with `src/ui/typography` components (a `variant` and a
  `tone`; `style` for layout only), and takes input with `TextField`. No
  react-native `Text`/`TextInput`, no `theme.typography` reads (ADR 0015).
- Has an accessibility label where the visual is the only cue, and a hit target
  of at least 44x44 points for anything tappable.
- Handles the empty, loading, and error states, or takes them as props. A screen
  with only a happy path is unfinished.

## Scrolling pages

Every page that scrolls composes `ScrollScreen` (`src/ui/organisms`), `ListScreen`
for a long list, or `MilestoneScreen` — all three are `ScrollFrame`, and nothing
else draws a page's top or foot. The scroller runs the phone's full height and
width; the page inset sits on its content and on the header, never around the
scroller (`<Screen padded>` around a `ScrollView` is wrong).

- **The top** is the `header` slot: it floats over the scroll on its own
  backdrop (`HeaderBackdrop`, drawn inside the header's block, so it's never
  see-through, measured or not) —
  solid behind the status bar and the header (at `edgeFade.peak`, 0.85, so what
  scrolls under still shows faintly — every page-edge fade and tint shares it),
  fading out 16pt below it — so what
  scrolls up dissolves under it. With no header the status bar still gets it.
  A header with controls that sit low in it (Plans' filters, Study's steps)
  takes `headerFade="gradual"`: a thicker, eased fade inside the header's own
  block, ending exactly at its bottom edge.
- **The foot** is the dock (`FloatingDock`): the tab bar's own container — same
  place, height, side margins, and tint (`DockTint`, solid below the pill, fading
  16pt above it). Pass `footer` one `Button`, or a bar's pill (Study's pager);
  a verdict goes in `feedback` (`FeedbackPanel`) and takes the dock's place.
- Content rests clear of both (`useFrameClearance`, from `getFrameEdges`); never
  hand-tune room for a header, footer, or fade, and never hand-roll a fade.
- Home and Plan Overview draw their own heroes and are the only exceptions.
- Plans pins its header (`ListScreen`'s `pinned`): the title; the filters —
  In progress and Done with their counts, as `FilterPills` (a second tap on
  the one picked lets it go) — centred in the room beside it; and the search
  at the right (`HeaderIconButton`, white with its hairline edge). It stays
  under the status bar on solid white with no fade and no shadow — the list
  starts below the status bar, so nothing ever shows behind it. Once the list
  scrolls, the title is bumped left off the screen and the filters spring
  left into its place (`PlansHeader`, `motion.slide`); back at the top, both
  return. Pills whose outline springs get room either side (`bleed`), so it's
  never clipped. The cards never meet a straight cut under it: the bar's foot
  carries two inward corners at the cards' sides and radius (`pinned.rounded`,
  `RoundedEdge`), so a card scrolls up into a rounded window. Plans only, and
  the top only.

## Search

Header icon buttons are white with their hairline edge, never a grey fill.
Two side by side share one pill (`HeaderButtonPill`, iOS's grouped toolbar
without the glass). A field on the keyboard sits in `KeyboardBar`: 8pt from
the screen's edges and the keys, rising and falling with the keys on their own
duration and curve (`useKeyboardLift`, on the UI thread — never
`LayoutAnimation`, which a modal sheet doesn't honour), the page running on beneath it, behind it
and the gap below the page's edge tint at `edgeFade.peak`, ending flush with
the field's top — so what scrolls under shows faintly.

A search is full screen and fades in with the keyboard up (Plans' search,
`/plan-search`): the field (`SearchField`) sits on the keyboard with the close
beside it, 8pt from the screen's edges and the keys, and the results fill the
page from the top — compact rows, small artwork, titles regular up to two
lines, the whole row tappable. The words found are black and medium, the rest
of a title holding them the supporting grey (weight alone is too faint). Under
the title, one quiet line says why it matched — the church when the title did,
else where the words were found — and where the plan stands ("Day 2 of 7"),
so plans of one title are told apart. The words are debounced before they're
searched. Rows already shown that still match stay mounted while the next
search is out and move to their new place when it answers (`motion.results`);
a skeleton in the rows' shape shows only when there are none to keep. A
field's clear is iOS's: a small grey-filled `CircleX`.

## Loading, errors, footers, and images

These hold on every screen; a screen that breaks one is unfinished.

- **No spinners after launch, and no full-screen loaders.** Launch is the
  native splash, then `LoadingScreen` — the same wordmark on white — and
  nothing else. Content on its way is a skeleton in its own shape (`Skeleton`
  with `Bone`s and `SkeletonLines`; `ContentPending` only where nothing has a
  shape yet), breathing gently, still under Reduce Motion. A skeleton never
  snaps away: it hands over through `SkeletonHandoff` (fading out over the
  content as the content fades in), around a part of a page or, with `fill`,
  a whole pending screen. The one `Spinner`
  marks a step under way in a list of steps (the generation sheet). A button
  never spins: while its action runs it keeps its words and ignores a second
  press, and where it can it doesn't wait at all (Create plan closes New Plan
  at once).
- **Never a dead end.** Every error offers a way out — Close, Back to plan,
  Back to Plans. Retry is offered only when trying again can help (the server
  couldn't be reached), and always beside a way out (`NotFoundScreen`'s
  `secondary`, `ScreenLoadError`'s `leave`). An answer from the server — a day
  not open yet, a plan that isn't there — is said plainly, never retried.
  Don't navigate into what's known to be locked: show it where it is. A way on that
  isn't open yet ("Day 3 tomorrow") waits: a lock, `CompactButton`'s `waiting`
  tone or `FloatingButton`'s `waiting` — opaque `waitingFill` with
  `waitingInk`, no edge of its own. Never translucent, and never the white or
  black of a button that's ready.
- **Both ends fade, the same way everywhere.** See Scrolling pages: the
  header over a `TopFade`, the way on in the dock on the tab bar's tint. A
  custom floating bar uses `FloatingBar` or `DockTint`, never its own fade.
- **Navigation never waits on the network.** Warm what the reader is about to
  open (`usePrefetch` in `@/core/api/prefetch`): a plan from its list, a day
  from its plan.
- **Images go through `expo-image`** (`VideoThumbnail` for artwork), cached in
  memory and on disk; artwork about to be seen is warmed with `prefetchImages`
  (`@/core/images`).

## Page entrances

A page whose parts arrive in turn (the Daily Study's) wraps each part in
`PageEnter` (`src/ui/atoms`): a Reanimated CSS animation declared in its
style — fading in as it moves left into place, never up or down, a beat
behind the part before (`motion.pageEnter`). It plays on mount, so the page
is keyed (`key={pageIndex}`) to play it again; never trigger an entrance from
an effect, a key comparison, or an animation callback. Reduce Motion keeps
the fade and drops the movement.

## An outline means it does something

A card on the surface fill (`Card`) keeps its `containerBorder` outline only
when it is there to be acted on: the card itself is tappable, it holds a
control (a switch, a time, a button, a pencil), it is swiped, or pills hang
from it on lines (`ModuleActions`). A card that is only read — a passage, a
tally, a stat, a callout, a preview — is `Card edge={false}`: the fill alone.
A card drawn by hand counts too; better, make it a `Card`. `AboutRows`
works it out for itself: outlined only when one of its rows goes somewhere.

## Pressing a row

A row in a list — Settings' and About's rows, Progress's rows, The Word's
passages, search results, a popover's or menu's options, the week picker —
never changes its background when pressed. No grey flash, no highlight: the
row stays as it is and does what it does. (A button may still dim.)

## Controls are ours, never iOS's glass

On or off is `Toggle` (`src/ui/atoms`), never react-native's `Switch`; a value
picked from a control (a time) opens in `Popover`, never a native compact
picker's own popover. Every floating container is `Popover`, so all of them
share one look and one motion.

A change saved optimistically never disables the page's controls while it's
out — a control greyed for the moment a save takes makes the whole page
flicker on every change. Ignore a second tap in the view model instead.

## Options behind a switch

When a switch turns a feature on (Daily reminder), what it governs is shown
only while it's on: each part is wrapped in `Reveal` (`src/ui/atoms`), mounted
with the switch on. It cascades in from the top — fading, drifting
`motion.reveal.fromY` down, a beat behind the part above — and fades out all
together, quicker, when turned off. Never a disabled, greyed-out section.

## About pages and Settings subpages

Every Settings subpage composes `SettingsSubpage`: the bar (Back, the page's
title beside it), a body whose blocks are `gap` apart, and a page that ends
24pt above the floating tab bar. The gap lives on the body, never between the
last block and the foot. A page's closing line (an effective date, a note on
what a setting does, what to leave out, a motto) is its `footnote`, never a
line hugging the block above or at the top of the page: one style on every
subpage — left-aligned, `rowDetail` (15 on a 22 line), the supporting grey,
inset 19pt so it lines up with the words inside the cards — set well apart at
the foot, at the bottom of the screen on a short page.

About's pages (Meet the creator, How plans are made, Privacy policy and its
pages, Contact support, Request sermon removal) are built only from what the
rest of the app already uses — never a hero, an eyebrow, or a device of their
own:

- **Open** with `AboutLead`: the app's page title (`SFProTitle "screen"`), then
  a line in the Study's reading type and grey (`SFProBody "reading"`,
  `textInactive`).
- **Sections** (`AboutSection`): the Study's paragraph heading
  (`SFProTitle "step"`), paragraphs in the reading type.
- **Lists** (`AboutRows`): Settings' own soft card, hairlines between rows;
  a quiet icon, the row's name in the **regular** weight, its description in
  `rowDetail` (15 on a 22 line), a chevron where it goes somewhere.
- **One strong line** (`AboutCallout`): serif standfirst on a soft card, as the
  Study sets Scripture.
- **Forms**: `SettingsField` (New plan's field: soft fill, hairline edge, an
  icon), `Chip` for a choice, the app's `Button`.

A group's title over its card — Settings' groups, Weeks' months, All
reflections' plans — is one style: `SFProBody` `label` in the supporting grey
(`textSupporting`), never the muted one, so a long list can be scanned by them.

Row and option labels across Settings are regular, never medium — iOS
Settings' weight. Medium is for titles and headings; semibold only on buttons.

## Progress

Progress is a week of study (`/v1/me/week`), built only from the app's own
parts: the week's head (source and dates in the tracked mono label, the title
in the serif), its seven days as Plan Detail's `DayTile`s with the springing
outline for the day picked (never a dot), the picked day's panel — fixed in
height — showing one passage at a time (its key verse in the Study's
Scripture face and what the reader wrote, from the phone; or ready, still
here, or opening), the Study's step bars for several passages, and Settings-
style rows of what's gathered in all. A day is studied only when a passage was
finished on it; reading a missed day later doesn't fill it. The page fits
the screen and never scrolls (`ScrollScreen`'s `fixed`): the day panel takes
the room the rest leaves, and the rows end 24pt above the tab bar. The week's
dates (dark, semibold, on Daily reminder's soft pill) open the weeks: up to
eight, a list in the app's `Popover`; past four, the full-screen weeks
(`/weeks`), zooming out of the pill (`Link.AppleZoom`) — a search, years as
Plans' filter pills, months, and each week a card with everything that helps
place it (artwork, title, church, passages, the first thing written, days
studied). A card opens the app's `PopoverMenu` with the tab bar's own icons:
see the week on Progress (`Flame`), or open one of its plans (`LibraryBig`).
Swiping the days moves between the same weeks. In development builds, a
Preview button steps the picker through made-up histories. No streaks, counts
in the strip, or guilt states. Copy states facts, never guesses.

The Word's row opens The Word (`/progress/word`, in Progress's own stack, the
tab bar up): the Bible as 66 lines, Genesis to Revelation, each as tall as its
book is long (by the square root of its chapters), dark where a passage was
finished, the book picked in the accent with a mark beneath it. It opens
zoomed all the way out; a pinch zooms in about the fingers, to about a dozen
books across (`MAX_ZOOM`), and a drag then slides it along, gliding to a stop.
At full width a sideways swipe does nothing, and while a finger is on it the
page's back swipe is held. A finger on it names the book under it; a tap picks
the nearest studied book. Under
it, the studied books as `FilterPills` with their counts (the picked pill
scrolls into view), then the book's passages — its reference in the tracked
caps over one whole line from it in the Scripture face (`SerifBody` `line`) —
fading in as they rise (`panelEnter`) when the book changes. It opens on the
book studied last. Its passages sit on Settings' group card, each its
reference over its Scripture cut to one line; a tap (with `selectionFeedback`)
opens it whole on `motion.expand`'s spring, the rows below and the card
following, and the chevron stays where it sat closed. Rows' chevrons there
and on Progress are firmer (`textSupporting`, `icon.strokeWidthStrong`). The
page fits the screen (`ScrollScreen` `fixed`): only the list scrolls, inside
the page, its card rounding into the list's top edge (`RoundedEdge`), as
Plans' cards do. A switch in its header (`Toggle` with `icon`,
`ChartNoAxesColumn`, 6pt wider: on, the icon red in the knob; off, black in
the track) puts the chart away for more room to read: only the chart rolls up
(`Collapse`, `motion.rollUpMs`, on the UI thread) and the pills move up into
its room. The page's line above it never moves: its words change in place
(`Swap`), cross-fading as its height eases with the roll.

Your words' row opens Your words (`/progress/words`): the reflections written
on this phone — never uploaded, so no share or export — one at a time. The
questions, passages and studies come from the server (`/v1/me/reflections`);
what was written, and the lines added to it later (`reflection_lines`, one a
day, the original never edited), only from the phone. Under the title, the
count and "They never leave this phone." with a lock; a timeline of marks,
one a reflection (one a week past 40), scrubbed, the one in view sliding in
the accent; the reflection, one module on Settings' group card as Quick
Check's missed questions are — over it "Six weeks ago · Thursday, August 27"
as a group's title sits; in it, a line between each, the plan by its
artwork and two-line title (`ModulePlanRow`), "You were asked" and the
question, "You wrote" and the answer whole in the serif italic (a pencil at
the row's end), and the lines added since; hung from it, an "Open Day 3"
pill with its line down into it (`ModuleActions`) — scrolling on its
own, a long card rounding into the scroll's top edge (`RoundedEdge`), as
The Word's do. No buttons at the foot: it moves by the timeline, or the list of them
all. It opens on an older reflection, not the newest. The pencil opens a
sheet over
95% of the screen (`BottomSheet` `heightRatio`): the reflection read back —
asked, "You wrote · Thursday, August 27", the updates since — and under it
the Study's answer box for today's update, the keyboard up, saved as typed.
Done rides the keyboard (`KeyboardBar`) and keeps it; the X beside the title
(`BottomSheet` `onDiscard`) puts back what was there when it opened. A page that opens a writing sheet sets
`keyboardShouldPersistTaps="handled"` on its own scroll: a sheet's taps pass
through the page beneath, and without it the first tap on the sheet's X or
Done only puts the keyboard away. Before anything's written: the lock line keeps only its promise, and
the page's middle holds the milestone ring round `NotebookPen`, "Nothing
written yet" (`SFProTitle` `message`) and how it fills (`bodyLoose`, muted) —
no timeline, no buttons. With reflections, its header's right holds a notebook
(`Notebook`, `HeaderIconButton`, white with its hairline edge) that zooms out
the full-screen list of them all (`/reflections`, `Link.AppleZoom`): the
title, then search and close side by side in one pill (`HeaderButtonPill`) —
tapped, the search sinks into the page and the pill closes up round the close,
which never moves, while Plans' own field rises on the keyboard, full width
(`KeyboardBar`); the keyboard put away with nothing typed, the field goes and
the pill springs back out, the search icon with it — then
each plan's artwork and name (Weeks' quiet month label) over Settings' group card of its
reflections — question, date, chevron — the plan written in most lately
first. A row sends Your words to it (`wordsHref`). Only its close closes it:
no swipe down, the zoom's included, ever dismisses it
(`gestureEnabled: false`, `usePreventZoomTransitionDismissal`); with the
keyboard up, a drag only puts the keyboard away. The notebook taps
(`tapFeedback`) as it opens the list.

Quick Check's row opens Quick Check (`/progress/quick-check`), built as Your
words is, and saying what everything is. Its key is its count: a green dot
"36 correct", an amber dot "12 to revisit" (each Quick Check's latest
finished attempt only, from `/v1/me/quick-checks`). The grid (`RecallGrid`):
each day's Quick Check a capsule (`QuickCheckCapsule`), a segment a question
in order — green correct, amber missed, grey never answered — newest on the
left, a hairline between days, a caret's room and its date (black) under
each; dragged left to go further back (the back swipe held), both its edges
fading (`SideFade`). A small solid red caret (`Play`, filled, turned down; "this one", 10pt) over the question
in view; any segment tapped shows its question (one got right: "Correct" over the card, "You answered correctly" under a green mark, no "Correct answer" row); the row brings the one
in view's capsule into sight; the question's card scrolls up into a rounded edge (`RoundedEdge`), as Your words' does, its title inset clear of it. The key: "36 correct", "19 to revisit", and the
caret "Selected". (The dot blocks, `QuickCheckBlock`, are kept to bring
back.) The question missed is one module on Settings'
group card, a line between its parts: the plan by its artwork and two-line
title; "You were asked"; "You answered" — an amber dot and amber label
(`incorrect`) over their choice in black — and only what was wrong ("You didn't answer this one." in
grey if they didn't); "Correct answer" — a green dot and green label; both answers in the
Scripture face when they're Scripture's words (a verse to finish), else both
in the reading face; and "Open Day 3's study" with
a chevron. Over the card, in black, "To revisit · 1 of 12" — counted as the grid is read, newest first. Hung from the card (`ModuleActions`): a 12pt, 2pt-wide line (`borderStrong`) from its foot into the middle of each pill — an "Open Day 3" pill (`BookOpen`), "Retake" (`RotateCcw`, straight into its Quick Check at question 1) beside it — pills in the card's fill and edge. It moves between misses by its dots. A list button
(`ListChecks`) zooms out every Quick Check (`/quick-checks`), by plan (its artwork beside its name),
each row its passage, "Day 3 · 2 to revisit" (or "All correct") and the
day's capsule, small (`QuickCheckCapsule`), before its chevron — whether it's
worth taking again, at a glance — opening its results; only its close
leaves. Progress's Quick Check row draws them the same: green and amber dots.
Nothing missed says so plainly; before any, the empty state's ring round
`ListChecks`. It opens on the most recent miss — the newest
Quick Check's first missed question — its dot marked.

## Milestone pages

A page that marks a moment between steps — a day done, a plan complete, a
Quick Check to start or its score — composes `MilestoneScreen`
(`src/ui/organisms`). It owns every position and gap (Day Complete set them:
the mark 96pt below the safe area, then 20 / 8 / 20 / 32 / 16); a page passes
its mark, title, subtitle, badge, content, and footer, never spacing. A header
on one is only its close — no title — and floats, so it never moves the mark.
The only filled flame in the app is Plan Complete's; every other is an outline.

A day ends on one page. With a Quick Check, the last study step reads "Quick
Check", and its start page is the bridge — the Study's step bars as its mark,
"Today's study is done.", the facts (questions, about how long; what it's for
the first time), and "Start Quick Check"; its close leaves it waiting on the
plan. Finishing the last question scores it and completes the day at once,
then goes straight to the day's finish page: the day done, Progress's week
strip, what it gave (passage heading, key verse in quotes, what was written),
its Quick Check (what was remembered, every answer, missed first, numbers
kept), and what's next as facts. Done goes back to the plan. One success
haptic, when the day completes.

A finished Quick Check, opened again, shows its results with two buttons on
one row: "Take it again" (`RotateCcw`, soft) on the left, "Done" on the right.
Taking it again starts a fresh attempt (`POST /v1/quizzes/:id/retakes`) at
question 1 — the finished one counts until the new one is done, and the day
stays done. A retake, finished, shows its results there, never the day's
finish page; Done goes back to the plan.

## Right and wrong

A right answer is green (`correct`); a missed one is a deep amber
(`incorrect`) — "not yet", never the brand red, which means only "this one"
and "now" (`accent`). So red never says "wrong" anywhere, and amber says
nothing else. A missed question is an amber dot, as a remembered one is green;
a question never answered, a grey dash. A verdict panel leads with a solid mark in its colour —
a tick, or an X — beside "That's the one" or "Not quite".

## Haptics

One vocabulary, from `@/core/haptics/haptics`, called by the view-model hook or
feature component that owns the intent (never from `src/ui`, which can't reach
`core`):

- `selectionFeedback()` — a choice **changes** (a filter, a day, a size, an
  answer picked, a passage opened or closed on The Word). Silent when the same value is picked again.
- `tapFeedback()` — starting or moving through something (Continue, Start, Next,
  Create my plan, the tab bar).
- `successFeedback()` — an accomplishment (a day finished, a right answer, a
  Quick Check done, a plan built).
- `warningFeedback()` — a wrong answer checked. `errorFeedback()` — something
  failed (a link that isn't one, a build that broke).

Navigation — back, close, rows, settings — gets none, as in iOS. One press, one
haptic: if an outcome buzzes, the press that caused it doesn't also tap.

## iPhone only

Portrait, iPhone. No iPad layouts, no web-only APIs, no `Platform.OS === "web"`
branches. Respect the safe area by composing `Screen` rather than reimplementing
insets.

## Do not

- Do not reach for a new dependency for something `react-native` already does.
- Do not put business logic in a component; it belongs in the slice's hooks.
- Do not add an animation without checking `prefers-reduced-motion` behavior.
- Do not hand-tune a new spring. Take one from `motion` in `@/theme`: `slide`
  for an outline moving to what's picked (the day rail, the paper ring, the tab
  indicator, Plans' filter), `snap` for a marker that must land dead still (the
  text-size dot), `sheet` for a sheet. The entrances keep their own tuning
  until they're redesigned.
- Do not draw a sheet or menu with `Modal`'s own `animationType`: compose
  `BottomSheet`, or `Popover` (`PopoverMenu` for a menu), which slide and grow as iOS's do and stay
  mounted while they leave (`usePresence`).
- Do not use a warm grey for a line or fill. Edges are `containerBorder`, row
  lines `divider`, tracks `progressTrack` (see `src/theme/README.md`).
