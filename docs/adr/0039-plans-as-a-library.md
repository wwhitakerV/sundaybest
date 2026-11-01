# ADR 0039 — Plans as a library

- **Status:** Accepted
- **Date:** 2026-10-27
- **Deciders:** @wwhitakerv
- **Supersedes:** Plans as a sideways stack of pages, one plan to each

## Context

The Plans tab was a sideways pager: one plan's whole page at a time, dots
saying which, its drawers open. It showed one plan well, and the library
badly: a reader couldn't see what they had, and every plan weighed the same.

Plans should feel like opening a curated independent magazine library:
quiet, spacious, every plan a publication worth keeping, organised as an
Apple library is, never a dashboard or a course catalogue. The study itself
is where the spectacle is; the library is calm and clear.

It has to read well on every supported iPhone, the SE (375 × 667pt) included.

## Decision

- **One column, read down.** `ListScreen` under a pinned header, every plan
  one full-width entry: 16:9 artwork, then a folio, the title, the church,
  and its days once under way. No grid: at 375pt two columns leave each
  cover about 167pt wide, its title cut off in two lines and its artwork
  unreadable.
- **Two shelves.** My studies, and Done once a plan's been finished
  (`FilterPills`).
- **My studies leads with the plan opened last** on this phone. The server
  records no openings, so the phone does (`plans_opened`, migration 11).
  A plan's last activity is the later of that and its own last change, so a
  plan just made also comes first. The lead is `PlanIssue`: its church and
  Scripture over its title; a line run in after a label and a colon — the
  step waiting in its own words (`REFLECT:` and the question), its label in
  red, or `FROM THE SERMON:` and a quote; and, under a rule, its days led by
  "DAY" with the day it's on in red, opposite a compact `Continue →`. It's
  sized to fit an SE's screen, Continue included. Nothing behind it: a wash
  of the sermon's colour was tried and dropped. Home's `PlanFeature` keeps
  its own layout for now, and is to follow it.
- **Continue is never out of reach.** Whenever the lead's Continue is out of
  view, below the fold on an SE or scrolled under the header, the tab bar
  takes it.
- **Folios say only what the app knows:** its church, its Scripture, and,
  finished, when it was finished. Never a preached or upload date. No issue
  number: beside the days, "07" reads as a day. A plan's length is its days.
- **A colophon at the foot** of plain facts: plans, days studied, since when.

## Consequences

- The pager, its dots (`PageDots` and its paging utils), the per-page drawers
  and `PlanPage` are gone. `PlanLead` stays for Formation.
- Each entry fetches its plan's own page for its Scripture, the first few
  ahead of view. Until it arrives, the folio shows the issue and length.
- **"Study again"** (starting a finished plan from Day 1) needs a server
  action that doesn't exist yet. Finished plans open to read and revisit.
