# MASVS checklist — SundayBest

The review checklist `security-reviewer` works through. Modelled on the OWASP
Mobile Application Security Verification Standard, cut down to what applies to
**an iOS-only app with no accounts, no ads, and no tracking**. Items that do not
apply are listed as not applicable with the reason, so nobody re-derives it.

Verify against the current standard rather than this summary when it matters:
<https://mas.owasp.org/MASVS/>.

## MASVS-STORAGE — storage and privacy

- [ ] No credential, token, or personal data outside keychain-backed secure
      storage. Not AsyncStorage, not a plain file, not persisted state.
- [ ] Nothing sensitive in logs, including inside error objects and thrown
      messages. Strings go through `@/utils/redaction/redactSensitive` first.
- [ ] No sensitive data in a screenshot, app snapshot, or pasteboard.
- [ ] Data the user creates is deletable, and deletion actually removes it.
- [ ] No sensitive data in backups that should not be there.
- [ ] Caches (HTTP, image, query) hold nothing sensitive.

## MASVS-CRYPTO — cryptography

- [ ] No hand-rolled crypto, and no crypto primitive chosen by an agent without
      an ADR.
- [ ] Keys live in the keychain, are generated on-device, and are never
      committed, logged, or derived from something guessable.
- [ ] Randomness comes from a cryptographic source, never `Math.random()`, for
      anything security-relevant.

## MASVS-AUTH — authentication

**Mostly not applicable:** the app has no accounts and no sign-in. Revisit this
whole section if that ever changes.

- [ ] If a local gate exists (biometric or passcode), it fails closed and is not
      the only thing protecting data at rest.

## MASVS-NETWORK — network communication

- [ ] HTTPS only. No `http://`, no ATS exemption in `app.config.ts`.
- [ ] Every response is Zod-parsed before use. No `as` on a payload.
- [ ] No secret in a URL, query string, or header that gets logged.
- [ ] Failures fail closed, with no unverified fallback path.
- [ ] Timeouts and cancellation exist; a hung request cannot wedge the UI.
- [ ] Certificate pinning decision recorded — if not pinning, say why.

## MASVS-PLATFORM — platform interaction

- [ ] Every permission in `app.config.ts` is used, justified, and has an ADR.
      No speculative permissions.
- [ ] Deep links (`sundaybest://`) validate and Zod-parse their params. A
      crafted link cannot navigate to a privileged state or crash the app.
- [ ] No sensitive data in URL schemes, universal links, or share payloads.
- [ ] WebViews: none, or JavaScript disabled and the origin restricted.
- [ ] Pasteboard is not read or written implicitly.
- [ ] No use of private APIs.

## MASVS-CODE — code quality

- [ ] `npm audit` is at zero. Known advisories are pinned with the reasoning in
      `docs/PROJECT.md`.
- [ ] Dependencies are pinned exactly; Expo SDK packages via `npx expo install`.
- [ ] No secret in the repository, in history, or in an `EXPO_PUBLIC_*`
      variable — those are compiled into the bundle and are public.
- [ ] No debug or developer affordance reachable in a release build.
- [ ] Errors are handled; no silent `catch {}` swallowing a security failure.
- [ ] No suppressed lint or security rule without an ADR.

## MASVS-RESILIENCE — resilience

Scope decision: this is a **free devotional app with no accounts and no
payments**, so the threat model is a hostile network, a crafted deep link, and a
lost or jailbroken device — not a motivated attacker reversing the binary for
profit. Resilience work is therefore proportionate, not exhaustive.

- [ ] Integrity and attestation checks (`src/core/security/`) fail closed.
- [ ] Jailbreak detection informs behavior rather than being decorative, and
      cannot be the only control.
- [ ] No secret is embedded on the assumption the binary is opaque.
- [ ] Obfuscation is **not** relied on as a security control.

## Per-review sign-off

The reviewer states which sections were examined, the findings by severity, and
which items were not applicable to the diff. A section nobody looked at is
reported as not reviewed rather than as passing.
