---
name: release
description: Cut a release — bump the version from Conventional Commits, update the changelog, tag, push, and trigger the production build/submit pipeline.
disable-model-invocation: true
---

Every step here is either irreversible (a pushed tag triggers a real EAS
build and an App Store Connect submission) or expensive (an EAS build
consumes paid build minutes). Do not skip the dry run, and do not run
`--apply` without the user explicitly asking for a release right now.

See [docs/release/runbook.md](../../../docs/release/runbook.md) for hotfix
and rollback procedures — this skill covers a normal release only.

## 1. Confirm `npm run validate` passes

If it doesn't, stop. A release built on a red gate is not a release, it's a
bug report waiting to happen.

## 2. Dry run the version bump

```
node scripts/release.mjs
```

This reads every commit since the last `v*.*.*` tag, classifies each by
Conventional Commit type, and prints the version it would cut plus the
changelog entry it would write — nothing is changed yet. See
`scripts/release.mjs`'s own comments for exactly how `feat`/`fix`/`perf` and
a `!` or `BREAKING CHANGE:` footer map to minor/patch/major.

Read the printed commit list. If something is misclassified (a `feat:` that
was actually a fix, a breaking change with no `!` or footer), fix it with an
amended commit message before continuing — the script trusts the commit
history, not a separate release-notes file.

## 3. Apply it

Only after the user confirms the dry run looks right:

```
node scripts/release.mjs --apply
```

This bumps `package.json`, writes the `CHANGELOG.md` section, commits
(`chore(release): vX.Y.Z`), tags, and pushes both the commit and the tag to
`origin`.

## 4. Production build, submit, and update pipeline runs automatically

Pushing a `v*.*.*` tag is exactly what
[.eas/workflows/build-production.yml](../../../.eas/workflows/build-production.yml)'s
`push.tags` trigger watches for. It lints, tests, builds the iOS production
profile, submits to App Store Connect, and publishes a matching entry to the
`production` EAS Update channel — in that order, each depending on the last
succeeding.

Watch it in the EAS dashboard (`eas.dev` → this project → Workflows) or with:

```
npx eas-cli workflow:run .eas/workflows/build-production.yml
```

if it needs a manual re-trigger.

## 5. What's still manual

Nothing in this skill or the workflow submits App Store Connect's actual
review — that's Apple's own process, run from App Store Connect directly:

- Release notes / "What's New" text for the version.
- Screenshots, if the UI changed since the last submission.
- Answering the export-compliance and privacy questionnaire prompts if
  either changed (see `docs/privacy/data-inventory.md` and
  `app.config.ts`'s `ios.config.usesNonExemptEncryption`).
- Submitting the build for review once EAS Submit has uploaded it.

## Report

After a release: the version cut, the tag pushed, a link to the triggered
workflow run, and an explicit list of the manual App Store Connect steps
above that still need doing.
