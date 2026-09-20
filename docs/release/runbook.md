# Release runbook

Three procedures: a normal release, a hotfix OTA update, and a rollback. See
[ADR 0009](../adr/0009-eas-build-submit-and-update-pipeline.md) for why the
pipeline is built this way, and the
[release skill](../../.claude/skills/release/SKILL.md) for the automated half
of the normal-release path.

## Normal release

1. Confirm `npm run validate` passes on `main`.
2. Dry run the version bump: `node scripts/release.mjs`. Read the printed
   commit list and changelog — fix any misclassified commit message before
   continuing (see the script's own comments for the classification rules).
3. Apply it: `node scripts/release.mjs --apply`. This bumps `package.json`,
   writes `CHANGELOG.md`, commits, tags `vX.Y.Z`, and pushes both.
4. The pushed tag triggers
   [`.eas/workflows/build-production.yml`](../../.eas/workflows/build-production.yml):
   lint → test → build the `production` iOS profile → submit to App Store
   Connect → publish a matching entry to the `production` EAS Update
   channel. Watch it in the EAS dashboard, or `npx eas-cli workflow:run
.eas/workflows/build-production.yml` to re-trigger manually.
5. In App Store Connect: write release notes, update screenshots if the UI
   changed, re-confirm the export-compliance and privacy answers if
   `docs/privacy/data-inventory.md` changed since the last submission, then
   submit the build for review.
6. Once Apple approves and releases the build, verify on a real device —
   TestFlight first if there's any doubt.

## Hotfix OTA

For a JS-only bug (no native code change) that can't wait for App Store
review.

1. Branch from the tag currently live in production:
   `git checkout -b hotfix/<short-description> vX.Y.Z`.
2. Fix the bug. Keep the diff as small as the fix allows — a hotfix branch is
   not the place for anything else.
3. `npm run validate` on the branch.
4. Push the branch, then dispatch
   [`.eas/workflows/hotfix.yml`](../../.eas/workflows/hotfix.yml) with
   `branch` set to the hotfix branch name — from the EAS dashboard, or:
   ```
   npx eas-cli workflow:run .eas/workflows/hotfix.yml
   ```
   (the dashboard path is what actually prompts for the `branch` input; the
   CLI path runs against your local checkout, so check out the hotfix
   branch first if using it).
5. This lints, tests, then publishes an EAS Update directly to the
   `production` channel — no native build, no App Store review, live to
   every device on the next app launch (or foreground, per
   `expo-updates`' `checkAutomatically` setting).
6. Verify: `npx eas-cli update:list --channel production` shows the new
   update group at the top. Check the app itself on a real device.
7. **A hotfix does not change what's in the native binary.** Merge the
   hotfix branch back into `main` too (via a normal PR), or the next real
   release will silently revert the fix — the OTA update is a bandage over
   the build's original bytecode, not a change to it.
8. If the bug turns out to need a native-code or config fix (a new
   permission, a native dependency change, anything `expo-updates`' own
   fingerprint would flag as incompatible), an OTA update cannot ship it —
   fall back to a normal release instead. `expo-updates` refuses to apply
   an update whose fingerprint doesn't match the running binary, so this
   fails safely rather than silently.

## Rollback

When a published update (OTA or a store release) turns out to be bad.

### An OTA update is bad

```
npx eas-cli update:rollback
```

Interactive; walks through two choices:

- **Roll back to a previous update** — re-publishes an earlier update group,
  so every device that checks for updates gets that older bundle again.
- **Roll back to the embedded update** — tells clients to run whatever
  shipped inside the original binary, ignoring every OTA update published
  since. Use this when every OTA update since the last store release is
  suspect, not just the most recent one.

After a rollback, publishing again resumes normal delivery to every client —
a rollback is not a persistent state, it's a one-time redirect.

### The store build itself is bad (a native-code bug)

No OTA update or rollback fixes this — the bug shipped in the binary, and
`expo-updates` can only replace the JS bundle, not native code. Options, in
order of how fast they help:

1. **If Apple's review hasn't finished yet**, remove the build from review
   in App Store Connect and submit a fixed one instead.
2. **If it's already live**, use App Store Connect's "Remove from Sale" or
   phased-release pause (if phased release was enabled) to stop new
   installs while a fixed build goes through review — this does not fix it
   for users who already updated.
3. **Cut a real release** (see "Normal release" above) with the fix, and get
   it through review as fast as the bug's severity justifies — expedited
   review is available from App Store Connect for genuinely urgent issues.

There is no fast path here by design: a native-code bug is exactly the case
`expo-updates`' fingerprint runtime policy exists to protect against papering
over with an OTA update that doesn't actually match the running binary.
