# ADR 0041 — A sermon's points are kept across its plan lengths

- **Status:** Accepted
- **Date:** 2026-10-31
- **Deciders:** @wwhitakerv
- **Amends:** ADR 0021 (reuse generated plans), ADR 0040 (faithful exposition)
- **Amended by:** ADR 0043 (sermon titles): kept points no longer carry a title

## Context

A finished plan is reused only at exactly the same length (ADR 0021), so one
sermon can cost up to seven full runs. Cutting a 7-day plan down in code was
considered and rejected. Days glued together read as two or three days in
one, carry 12–18 faculties and several passages, and a short sermon spread
over seven days is the weakest plan to cut from.

Most of the plan step's work is the same at every length: the sermon's points,
where each is made, its title, its speaker and About this plan. That is also
the slowest call in a plan.

## Decision

- **Keep what doesn't depend on length.** When a plan finishes, its title,
  speaker, points and About this plan are kept in `sermon_inventories`, one per
  sermon under the current generator and prompt versions.
- **Another length only divides the points into days.** It's a smaller plan
  step (`sundaybest_plan_days`). It gets the kept points, with the transcript
  block each is made in, and writes each day's title, focus, passage, points
  and other passages. Its days are checked and put right exactly as the plan
  step's are (`mapDays`), and the review notes that the points were kept.
- **Days, faculties and quizzes are still written for each length.** Code
  never joins or cuts days.
- **Kept points are used only when there are at least as many as the plan has
  days.** Otherwise the plan step finds them fresh. Points found later replace
  the kept ones only when there are more of them.
- **A reader who already has a plan for the sermon is never given the kept
  points.** Asking again is asking for a fresh one, as ADR 0021's amendment
  says.

## Consequences

- Every length of a sermon teaches the same points in the same words, with
  the same title and speaker.
- Lengths after the first skip the slowest call.
- A bad set of points reaches every later length of that sermon until a
  version bump. Read each new sermon's first plan in the dev admin review.
- A prompt or generator version bump retires kept points along with reusable
  plans.
