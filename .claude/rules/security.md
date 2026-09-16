---
paths:
  - "src/core/security/**"
  - "src/core/api/**"
  - "src/core/storage/**"
  - "src/core/config/**"
  - "app.config.ts"
  - "app.json"
  - "eas.json"
  - ".eas/**"
---

# Security rules

You are in the audited part of the codebase. Use plan mode and get the plan
approved before editing these files.

Review against [docs/security/masvs-checklist.md](../../docs/security/masvs-checklist.md).

## Secrets

- No secret in code, in a committed file, or in an `EXPO_PUBLIC_*` variable.
  `EXPO_PUBLIC_` values are compiled into the bundle and readable by anyone who
  downloads the app — treat them as public.
- Never read, print, or invent a real credential. `.env.example` holds
  placeholders only, and reads of `.env*` are denied by permission rules.
- A secret the app genuinely needs at runtime belongs behind a server, not in
  the client.

## Data handling

- Tokens, keys, and personal data go in secure storage (keychain-backed) only.
  Never AsyncStorage, plain files, or persisted state.
- Parse with Zod at the boundary. Never `as` an untrusted payload.
- Log nothing about the user or device. Route logging through
  `src/core/monitoring` and pass strings through
  `@/utils/redaction/redactSensitive` first.
- Fail closed. If attestation, integrity, or a parse fails, deny the operation;
  do not fall back to an unverified path.

## Network

- HTTPS only, no exceptions, and no ATS exemptions in `app.config.ts`.
- Treat every response as hostile until parsed.
- No secrets in URLs or query strings; they land in logs.

## Changes that need an ADR

- Adding a native module or any SDK with a side effect.
- Adding an iOS permission, entitlement, or background mode.
- Disabling a lint or security rule.
- Any new data leaving the device.

Write the ADR before the code, and say what the alternative was.
