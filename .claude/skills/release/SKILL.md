---
name: release
description: Cut a release. Placeholder until prompt 11 defines the release process.
disable-model-invocation: true
---

**Not implemented yet.** Prompt 11 of the setup series defines the release
process; this file is the seam it fills.

If you are asked to release before then, stop and say so. Do not improvise a
release: nothing here has been decided, and the expensive, irreversible steps
live in exactly this workflow.

Still to be defined:

- Version and build-number strategy, and who owns bumping them.
- EAS build profiles, and which ones are allowed from a developer machine.
- The TestFlight path: internal group, external group, review notes.
- Store submission: screenshots, privacy questionnaire answers, age rating.
- Release checks: `npm run validate`, a real device smoke test, Maestro E2E
  (prompt 12).
- Rollback: what to do when a build is bad, and whether EAS Update is in play.
- What requires a human — every credential and submission step does.

Until this is written, `docs/SETUP_CHECKLIST.md` is the source of truth for the
manual steps.
