# Spec: <feature name>

- **Status:** Draft | **Approved** | Built
- **Owner:** @wwhitakerv
- **Date:** YYYY-MM-DD

> `/new-feature` refuses to start unless this spec is Approved, the acceptance
> criteria are Given/When/Then, and the privacy and security sections are filled
> in. Placeholder text left in place counts as not filled in.

## Problem

What is wrong or missing today, from the user's side. No solution here.

Why now, and what happens if we do nothing.

## User stories

- As a <who>, I want <what> so that <why>.

## Acceptance criteria

Numbered, Given/When/Then, each independently testable. These become tests
one-to-one, so write them as things a test can observe.

1. **<Short name>**
   - **Given** <starting state>
   - **When** <the action>
   - **Then** <the observable result>

2. **<Boundary case>**
   - **Given** ...
   - **When** ...
   - **Then** ...

Cover the boundaries explicitly: empty, missing, malformed, offline, too long,
and the error branch. An unspecified boundary gets guessed, and guesses ship.

## Data touched and privacy impact

| Data | Where it comes from | Where it is stored | Leaves the device? |
| ---- | ------------------- | ------------------ | ------------------ |
| ...  | ...                 | ...                | Yes/No — to where  |

- Is any of it personal or sensitive? If yes, it belongs in secure storage.
- What is the retention, and how does a user delete it?
- The app has **no accounts and no tracking**. If this feature appears to need
  either, stop and raise it.

## Security considerations

- Untrusted input, and where it gets Zod-parsed.
- New permissions, entitlements, or background modes — each needs an ADR.
- New dependencies, especially native ones — run `/add-dependency` first.
- What a malicious deep link, a hostile API response, or a jailbroken device
  could do here.
- What fails closed.

## testIDs

The identifiers tests and Maestro flows will use. Name them now so tests and UI
agree.

| Element | testID |
| ------- | ------ |
| ...     | ...    |

## Out of scope

What this explicitly does not do, so review does not ask for it and the feature
does not grow. Link follow-up specs.
