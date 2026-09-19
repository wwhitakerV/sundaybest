# Security policy

## Reporting a vulnerability

**Do not open a public issue.** Report privately through GitHub's Security
Advisory tool:

<https://github.com/wwhitakerV/sundaybest/security/advisories/new>

This opens a private draft advisory visible only to the maintainer
([@wwhitakerv](https://github.com/wwhitakerv)) until a fix is ready. Include:

- What you found, and where (file, endpoint, or flow)
- Steps to reproduce
- What you think the impact is

You'll get an acknowledgement as soon as possible. There's no bug bounty —
this is a small, free, single-maintainer app — but every report is read and
taken seriously.

## Scope

SundayBest is an iOS-only app with no accounts, no ads, and no tracking. See
[docs/security/threat-model.md](../docs/security/threat-model.md) and
[docs/security/masvs-checklist.md](../docs/security/masvs-checklist.md) for
what is and isn't in scope today, and
[docs/privacy/data-inventory.md](../docs/privacy/data-inventory.md) for what
the app actually collects and sends.

## Supported versions

Only the version currently available on the App Store (or the latest
TestFlight build, pre-launch) is supported. There is no long-term support
branch.
