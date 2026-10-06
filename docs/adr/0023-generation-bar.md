# ADR 0023 — A plan builds in a bar above the tabs, not on a screen

- **Status:** Accepted
- **Date:** 2026-10-05
- **Deciders:** @wwhitakerv

## Context

Creating a plan waited on a "Create" button, then held the reader on a
full-screen Preparing screen and a Plan Ready screen for the minute or two a
build takes. The app's rule is no waiting buttons and no full-screen loaders
after launch: a build should carry on while the reader does anything else.

## Decision

**Create plan closes New Plan at once.** The create request is fired, not
awaited; it lives in TanStack Query's mutation cache (`apiMutationKeys.createPlan`),
so it outlives the modal that sent it.

**A generation bar floats above the tabs** wherever the reader is
(`GenerationBarHost`, mounted beside the tab navigator; `useTabBarBanner` in
`src/ui/organisms/tab-bar`). It's a pill the tab bar's height, in the raised
place a screen's button uses, with the FAB shrinking beside the open tabs as
it does for a raised button; a screen's raised button takes the place first.
An X in its rounded start always dismisses it, then a full-height divider:

- **Building:** the primary control's colours, "Creating your plan", the real
  percentage and a line filling to it. Tapping it opens a native half sheet
  (`/generation`) listing the steps — done steps checked in the accent, the
  step under way on the app's `Spinner`.
- **Ready:** the brand green (`success`), the plan's title, and Open.
- **Failed:** the reason, and Retry — or New sermon when the sermon itself
  can't be built from (no captions, not Bible teaching). A plan that couldn't
  even be sent shows here too, with Retry.

**The server tells the truth about progress.** The worker moves a build
through its statuses as each pipeline step finishes, and keeps a `progress`
percentage that only moves forward (`build-tracker.ts`). The app lists
`GET /v1/plan-generations/current` — builds not yet dismissed, newest first —
every two seconds while any is building, and `POST …/:id/dismiss` takes one
off the bar (dismissing a build doesn't stop it). Opening a ready plan from
anywhere dismisses it. The Preparing and Plan Ready screens are gone.

## Consequences

### Good

- Nothing waits: a plan is asked for in one tap and the reader keeps going.
- The bar survives restarts and shows a finished or failed build exactly once.

### Bad

- A bar dismissed while building leaves no trace until the plan appears in
  Plans; the Plans screen is the place to show builds in progress later.
- Two builds at once show the newest, with a count; the sheet shows one.
