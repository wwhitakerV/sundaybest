# Setup checklist

Steps that need a human: credentials, account actions, or a paid plan. Agents must
never perform these — they stop and add the step here instead.

## Manual steps

- [ ] **Apple Developer Program — organization enrollment.** Requires a D-U-N-S
      number for the legal entity. Request the D-U-N-S number first (free, can take
      up to ~5 business days), then enroll. Organization enrollment is required for
      a company-name App Store listing; individual enrollment does not need a D-U-N-S.
- [ ] **Enable 2FA on Apple ID.** Required for App Store Connect and for EAS
      credential automation.
- [ ] **Enable 2FA on the Expo account** (`walt.whitakerv@gmail.com`).
- [ ] **Enable 2FA on GitHub** (`@wwhitakerv`), and prefer a hardware key or TOTP
      over SMS.
- [ ] **Register the three bundle IDs** in the Apple Developer portal. All three
      are defined in `app.config.ts`:
  - [ ] `com.walterwhitaker.sundaybest` (production)
  - [ ] `com.walterwhitaker.sundaybest.preview`
  - [ ] `com.walterwhitaker.sundaybest.dev`
- [ ] **Replace the placeholder app icons.** `assets/icon.png`,
      `icon-development.png`, and `icon-preview.png` are generated block-letter
      placeholders (`npm run icons`). Real artwork is needed before any TestFlight
      or App Store submission, and must have no alpha channel. Splash artwork is
      still unset — `app.config.ts` configures only a background colour.
- [ ] **Confirm the export-compliance answer before the first submission.**
      `app.config.ts` sets `ios.config.usesNonExemptEncryption: false`, which is
      accurate for an app that uses only the platform's TLS. Prompt 7 adds
      SQLCipher (encryption at rest via a third-party library), which can change
      the answer. Re-read Apple's "Complying with Encryption Export Regulations"
      and confirm, because an incorrect declaration is a legal compliance problem,
      not a config bug. Verify the value with `npx expo config --type prebuild` —
      Expo strips `ios.config` from `--type public`.
- [ ] **Set up universal links, or remove the placeholder.** `app.config.ts`
      declares `associatedDomains: ["applinks:sundaybest.com"]`, which is a
      placeholder and does nothing on its own. It needs:
  - [ ] the domain `sundaybest.com` registered and served over https
  - [ ] an `apple-app-site-association` file at
        `https://sundaybest.com/.well-known/apple-app-site-association`, listing
        the team ID and each bundle ID
  - [ ] the Associated Domains capability enabled on each bundle ID
  - [ ] a decision on whether universal links are wanted at all; if not, delete
        the entry rather than shipping a dead entitlement

## Backend — attestation and sessions

**None of the client-side attestation work is worth anything until a server
verifies it.** An assertion nobody checks is theatre. The contract is
[docs/api/attestation.md](./api/attestation.md); these are the obligations it
places on whoever builds the server.

- [ ] **Verify attestations per Apple's guide**, in full — not the easy parts:
  - [ ] the certificate chain up to Apple's App Attest root
  - [ ] the nonce: SHA-256 of the authenticator data concatenated with the
        SHA-256 of the challenge
  - [ ] the App ID hash against the correct team ID and bundle ID
  - [ ] the signature counter is `0` on attestation
  - [ ] the `aaguid` (`appattestdevelop` in the sandbox, `appattest` plus zero
        padding in production)
  - [ ] store the receipt, which is what later lets you assess risk per key
- [ ] **Verify assertions on every request**, and store each key's public key at
      registration so there is something to verify against.
- [ ] **Never act on a `keyId` alone.** A `keyId` is public. Acting on one
      without a verifying assertion lets anyone burn another install's rate limit
      — abuse case U5 in the threat model.
- [ ] **Replay protection**, both halves:
  - [ ] challenges are single-use, stored, deleted on first use, and expire after
        120 seconds
  - [ ] the assertion counter must **strictly increase** per key, and the write
        must be transactional with issuing the token — a non-atomic update is a
        replay window. This is the half that gets forgotten.
- [ ] **Issue tokens**: short-lived access token (900s default), refresh token
      rotated on every use. A refresh token presented twice means it leaked —
      revoke that key's session family and force re-attestation.
- [ ] **Rate-limit per attested key**: 10/min on `/attest/challenge`, 5/hour on
      `/attest/verify`, 30/hour on `/session/refresh`, plus a separate global
      limit for challenge requests that carry no `keyId`.
- [ ] **Accept both App Attest environments.** Apple ignores the
      `appattest-environment` entitlement once a build ships through TestFlight
      or the App Store, so a **preview build installed from TestFlight produces
      production attestations**. Decide per environment; do not infer it from the
      bundle ID.
- [ ] **Accept only the three known bundle IDs**, and keep production data to the
      production bundle ID.
- [ ] **Enable the App Attest capability** on all three bundle IDs in the Apple
      Developer portal. The entitlement is already in `app.config.ts`; the
      capability is a portal action.
- [ ] **Decide what revokes a key** — manual only, or automated on a risk signal
      from the attestation receipt.

## Per developer

Each person working on the repo does these once on their machine. Nothing here
is shared state, so they are not in the "Manual steps" list above.

- [ ] **Trust the folder** when Claude Code first asks. `permissions.allow`,
      `extraKnownMarketplaces`, and most `env` values in
      `.claude/settings.json` only take effect after the folder is trusted —
      `deny` and `ask` rules apply immediately either way.
- [ ] **Run `/plugin`** and confirm the Expo plugin is installed. The project
      declares it in `.claude/settings.json`, but a plugin from an external
      source is not installed automatically; `/plugin` shows the
      `claude plugin install` command if it is missing.
- [ ] **Run `/mcp`** and sign in to Expo, so the Expo MCP server is available in
      the session.
- [ ] **Log in to the Expo CLI as the same account**, which local MCP
      capabilities require: `npx expo whoami || npx expo login`.
- [ ] **Use `npm run dev:mcp`** rather than `npm start` when you want the MCP
      local capabilities (screenshots, tapping views, finding elements by
      testID). They need `EXPO_UNSTABLE_MCP_SERVER=1` on the dev server.
- [ ] **Confirm the hooks loaded** with `/hooks`, and the rules and memory with
      `/context`. `/doctor` diagnoses a config that is not taking effect.
- [ ] **Create a `.env`**: `cp .env.example .env`. The app parses its
      `EXPO_PUBLIC_*` variables at startup and refuses to launch without them,
      and `.env` is gitignored. `npm run check:env` validates whatever is there.
