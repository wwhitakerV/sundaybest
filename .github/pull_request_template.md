## What and why

<!-- One or two sentences: what changed, and the problem it solves. -->

## Spec

<!-- Link the spec, issue, or ADR this implements. If there isn't one, say why. -->

## Test evidence

<!-- What you ran and what it showed. Paste real output, not a description of it. -->

- [ ] `npm run validate` passes
- [ ] New behavior has a test that was seen to fail first (paste the failing run)
- [ ] Coverage thresholds hold (80% global, 95% in `src/utils/**` and `src/core/security/**`)

## Security checklist

<!-- See .claude/rules/security.md. Check what applies; leave the rest unchecked and say why in a comment. -->

- [ ] No secret in code, a committed file, or an `EXPO_PUBLIC_*` variable
- [ ] Every side-effect SDK import stays inside `src/core`
- [ ] Sensitive data (tokens, keys, personal data) goes through secure storage only
- [ ] Logging goes through `src/core/monitoring` and is redacted with `@/utils/redaction/redactSensitive`
- [ ] No new or widened lint/security-rule disable without an ADR
- [ ] Dependency rules (`boundaries/dependencies`) pass without a new exception

## Privacy impact

<!-- Does this change what the app collects, stores, or sends? -->

- [ ] No change to data collected, stored, or sent
- [ ] Changes data handling — `docs/privacy/data-inventory.md` is updated in this PR
- [ ] Adds a new SDK, permission, or network call — an ADR is included

## Screenshots

<!-- UI changes only. Before/after, or a short screen recording. Delete this section if there's no UI change. -->
