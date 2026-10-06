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

- **The top** is the `header` slot: it floats over the scroll on a `TopFade` —
  solid behind the status bar and the header, fading out 16pt below it — so what
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

## Loading, errors, footers, and images

These hold on every screen; a screen that breaks one is unfinished.

- **No spinners after launch, and no full-screen loaders.** Launch is the
  native splash, then `LoadingScreen` — the same wordmark on white — and
  nothing else. Content on its way is a skeleton in its own shape (`Skeleton`
  with `Bone`s and `SkeletonLines`; `ContentPending` only where nothing has a
  shape yet), breathing gently, still under Reduce Motion. The one `Spinner`
  marks a step under way in a list of steps (the generation sheet). A button
  never spins: while its action runs it keeps its words and ignores a second
  press, and where it can it doesn't wait at all (Create plan closes New Plan
  at once).
- **Never a dead end.** Every error offers a way out — Close, Back to plan,
  Back to Plans. Retry is offered only when trying again can help (the server
  couldn't be reached), and always beside a way out (`NotFoundScreen`'s
  `secondary`, `ScreenLoadError`'s `leave`). An answer from the server — a day
  not open yet, a plan that isn't there — is said plainly, never retried.
  Don't navigate into what's known to be locked: show it where it is.
- **Both ends fade, the same way everywhere.** See Scrolling pages: the
  header over a `TopFade`, the way on in the dock on the tab bar's tint. A
  custom floating bar uses `FloatingBar` or `DockTint`, never its own fade.
- **Navigation never waits on the network.** Warm what the reader is about to
  open (`usePrefetch` in `@/core/api/prefetch`): a plan from its list, a day
  from its plan.
- **Images go through `expo-image`** (`VideoThumbnail` for artwork), cached in
  memory and on disk; artwork about to be seen is warmed with `prefetchImages`
  (`@/core/images`).

## Milestone pages

A page that marks a moment between steps — a day done, a plan complete, a
Quick Check to start or its score — composes `MilestoneScreen`
(`src/ui/organisms`). It owns every position and gap (Day Complete set them:
the mark 96pt below the safe area, then 20 / 8 / 20 / 32 / 16); a page passes
its mark, title, subtitle, badge, content, and footer, never spacing. A header
on one is only its close — no title — and floats, so it never moves the mark.
The only filled flame in the app is Plan Complete's; every other is an outline.

## Haptics

One vocabulary, from `@/core/haptics/haptics`, called by the view-model hook or
feature component that owns the intent (never from `src/ui`, which can't reach
`core`):

- `selectionFeedback()` — a choice **changes** (a filter, a day, a size, an
  answer picked). Silent when the same value is picked again.
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
  `BottomSheet` or `PopoverMenu`, which slide and grow as iOS's do and stay
  mounted while they leave (`usePresence`).
- Do not use a warm grey for a line or fill. Edges are `containerBorder`, row
  lines `divider`, tracks `progressTrack` (see `src/theme/README.md`).
