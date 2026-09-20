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

## TLS pinning

`app.config.ts` and `src/core/api/pinning/` are ready; the hashes are not. A
**preview or production build will refuse to start** while the placeholders are
in place — that is deliberate, and it is this section that unblocks it.

- [ ] **Generate the real pin hashes** for `api.sundaybest.com`. A pin is the
      base64 SHA-256 of the certificate's Subject Public Key Info, not of the
      certificate itself. From a shell:

```sh
openssl s_client -connect api.sundaybest.com:443 -servername api.sundaybest.com </dev/null |
  openssl x509 -pubkey -noout |
  openssl pkey -pubin -outform der |
  openssl dgst -sha256 -binary |
  openssl enc -base64
```

- [ ] **Generate a backup key and pin it too.** Two pins per domain are
      required. The backup must be a key that is generated, **held offline, and
      not yet in use** — a backup pin for a key you do not have is not a backup,
      and a single pin means rotating the certificate bricks every installed copy
      of the app until users update.
- [ ] **Write down a rotation plan** before shipping, covering: where the backup
      key is stored, who can reach it, the order of operations (ship a build
      pinning both keys → wait for adoption → rotate the server to the backup →
      add a new backup in the next release), and the minimum adoption threshold
      before rotating. Rotating without an already-shipped backup pin is an
      outage with no remote fix.
- [ ] **Manually test a bad certificate on a preview build.** Nothing in CI can
      verify pinning — the unit tests cover the config and the gate, and say
      nothing about whether TrustKit rejects anything. Put a proxy (Charles,
      mitmproxy) in front of the device with its own root trusted by the device,
      then confirm requests **fail**:
  - [ ] with the real pins, requests through the proxy fail
  - [ ] with pinning disabled, the same requests succeed — otherwise the test
        proved nothing
  - [ ] **start from a cold launch each time.** TLS sessions are cached, so a
        connection that already succeeded keeps succeeding after the pins change.
- [ ] **Re-check after any certificate or CA change**, and after any
      `expo-sqlite`/SDK upgrade that could move the app back onto `expo/fetch`
      (`EXPO_PUBLIC_USE_RN_FETCH=1` must stay set — see ADR 0006).

## Runtime integrity (freeRASP)

- [ ] **Register with Talsec** and replace `PLACEHOLDER_WATCHER_MAIL` in
      `src/core/security/integrity/freerasp-integrity.ts` with the real reporting
      address. Threat reports go there; a placeholder means nobody is told.
- [ ] **Replace `PLACEHOLDER_APP_TEAM_ID`** with the Apple Developer team ID.
      freeRASP checks the app's signature against it, so a wrong value makes
      every launch look like a tampered build.
- [ ] **Mount it.** `useIntegrityMonitor` is written and tested but **nothing
      renders it yet** — it needs a session to clear and a monitoring sink to
      report to. Until then no integrity signal is ever received.
- [ ] **Test on a jailbroken device**, or accept that the detection is unverified.
      A simulator cannot exercise it: development deliberately turns monitoring
      off, because a simulator trips `simulator`, `debug`, and `devMode` by design.

## Crash reporting (Sentry)

`src/core/monitoring/crash-reporter.ts` and `metro.config.js` are ready;
nothing is provisioned. **A build with no DSN sends nothing** — that is
deliberate, and it is this section that turns reporting on.

- [ ] **Create the Sentry project** and obtain its DSN, then set
      `EXPO_PUBLIC_SENTRY_DSN` for the preview and production EAS build
      profiles. This is **not a secret** — like the API URL, it is compiled into
      the bundle and readable by anyone with the app — but it is per-project, so
      it cannot be invented here. Leave it empty in development.
- [ ] **Generate a Sentry auth token** (Sentry → Developer Settings → Auth
      Tokens) and store it as an **EAS environment variable named
      `SENTRY_AUTH_TOKEN` with secret visibility**. This one genuinely is a
      secret: it authorizes uploading source maps and must never be
      `EXPO_PUBLIC_*`, never in `.env`, never committed. With no `organization`
      or `project` passed in `app.config.ts`'s plugin entry, the Sentry Expo
      config plugin falls back to `SENTRY_ORG` / `SENTRY_PROJECT` /
      `SENTRY_AUTH_TOKEN` environment variables at build time — set those three
      as EAS environment variables too (org and project are not secrets;
      `SENTRY_AUTH_TOKEN` is).
- [ ] **Confirm source maps upload from EAS Build** on the first real preview
      build — check the Sentry project's Releases view for the build's
      release/dist. No extra step should be needed; the plugin handles it once
      the environment variables above are set.
- [ ] **Confirm source maps upload from EAS Update separately.**
      `expo-updates` is now installed (see "EAS build, submit, and update
      pipeline" below), so this applies once the first real update
      publishes. EAS Update's source-map upload is
      `npx sentry-expo-upload-sourcemaps dist`, a distinct step from the
      Build-time upload, chained after `eas update` or run as its own CI step.
- [ ] **Revisit `metro.config.js`'s decision to skip `withSentryConfig`.**
      `@sentry/react-native/metro`'s `withSentryConfig` (Debug IDs, better
      source-map correlation) currently breaks `npx expo export -p ios` with
      `TypeError: Cannot read properties of undefined (reading 'match')`,
      thrown from inside Sentry's Metro serializer once it processes the real
      module graph. Source maps still work without it via the release/dist tag.
      Re-test with whatever `@sentry/react-native` version is installed at the
      time — check its changelog for a Metro/serializer fix first.
- [ ] **Add crash data to the App Store privacy questionnaire** before the
      first submission: category **Diagnostics → Crash Data**, not linked to
      the user, not used for tracking. See
      [docs/privacy/data-inventory.md](./privacy/data-inventory.md) for what is
      actually sent.

## Repository guardrails and CI

`lefthook.yml`, `.github/workflows/ci.yml`, `renovate.json`, and the
GitHub-side governance files (`.github/CODEOWNERS`,
`.github/pull_request_template.md`, issue templates, `SECURITY.md`) are all
in place. These account-level and settings-level actions are not:

- [ ] **Run `scripts/setup-branch-protection.sh`.** Needs the `gh` CLI
      installed and authenticated (`gh auth login`) as an account with admin
      on the repo. Sets, on `main`: pull requests required, 1 approval
      minimum, Code Owner review required, the CI job required and
      up-to-date, signed commits required, linear history required, force
      pushes blocked. Re-run it if the CI job name in
      `.github/workflows/ci.yml` ever changes — the script matches by name,
      not by workflow file.
- [ ] **Install the Renovate GitHub App** on the repo
      (<https://github.com/apps/renovate>) so `renovate.json` actually takes
      effect. The config file alone does nothing without the app installed.
- [ ] **Turn on GitHub secret scanning with push protection.** Repo Settings
      → Code security → Secret scanning. Push protection rejects a commit
      containing a detected secret _before_ it reaches the remote — a second,
      GitHub-native layer alongside the local gitleaks pre-commit hook and
      the gitleaks CI job, not a replacement for either.
- [ ] **Turn on Dependabot alerts.** Repo Settings → Code security →
      Dependabot alerts. Distinct from Renovate: this is GitHub's own
      vulnerability _detection_, Renovate is the _update_ automation: keep
      both on.
- [ ] **Set up commit signing for each developer**, before running the
      branch-protection script above — once `required_signatures` is on,
      an unsigned commit cannot be pushed at all. GPG or SSH signing key,
      registered with GitHub
      (<https://docs.github.com/en/authentication/managing-commit-signature-verification>),
      and `git config commit.gpgsign true` (or the SSH equivalent) locally.
- [ ] **Install the `gitleaks` binary** for the pre-commit hook to find on
      `PATH` — Homebrew (`brew install gitleaks`) or a binary download from
      <https://github.com/gitleaks/gitleaks/releases>. **Not**
      `npm install gitleaks`: the npm package of that name is an unrelated
      tool by a different author, not the real gitleaks.

## EAS build, submit, and update pipeline

`eas.json`, `.eas/workflows/`, the release skill, and
[docs/release/runbook.md](./release/runbook.md) are all in place. None of it
can run for real until these account-level steps happen — `app.config.ts`'s
`updates.url` and `extra.eas.projectId` are placeholders until the first one
does.

`eas-cli` is deliberately **not** a project dependency — `expo-doctor`
rejects installing it in `package.json` at all. Every command below uses
`npx eas-cli`, which always runs the latest release without needing a
global install (a global `eas` install works too, if preferred).

- [ ] **Run `npx eas-cli init`.** Creates the EAS project and fills in the
      real `extra.eas.projectId` in `app.config.ts`, replacing
      `PLACEHOLDER_EAS_PROJECT_ID`. Also update `updates.url` to
      `https://u.expo.dev/<the real project id>` if `eas init` doesn't do
      it automatically — confirm with `npx expo config --type prebuild`
      afterward.
- [ ] **Connect the GitHub repo in the Expo dashboard** (project settings →
      GitHub). Required for `.eas/workflows/`'s `pull_request_labeled` and
      `push` triggers to fire at all — without this, every workflow only
      runs via manual `npx eas-cli workflow:run`.
- [ ] **Create an Apple API key** (App Store Connect → Users and Access →
      Integrations → Keys, "App Manager" role or narrower) and store it in
      EAS credentials (`npx eas-cli credentials` → iOS → App Store Connect
      API Key). Never inline in `eas.json`'s `submit` section, which is
      deliberately empty for exactly this reason.
- [ ] **Generate the EAS Update code-signing key and certificate**:
      `sh
npx expo-updates codesigning:generate \
--key-output-directory keys \
--certificate-output-directory certs \
--certificate-validity-duration-years 10 \
--certificate-common-name "SundayBest"
`
      then `npx expo-updates codesigning:configure` to wire
      `certs/eas-update-certificate.pem` into `app.config.ts` (already
      referenced there — the file just doesn't exist yet). **Store
      `keys/private-key.pem` somewhere outside this repo** — a password
      manager or a separate secrets vault, never committed. Without code
      signing, anything that could intercept or compromise `updates.url`
      could push arbitrary JS to every installed copy of the app.
- [ ] **Create the EAS environment variables** referenced by `eas.json`'s
      per-profile `"environment"` field — `EXPO_PUBLIC_ATTESTATION_ENABLED`
      (`false` for `development`, `true` for `preview` and `production`),
      `EXPO_PUBLIC_API_URL`, and `EXPO_PUBLIC_SENTRY_DSN`, once that DSN
      exists (see "Crash reporting (Sentry)" above) — one value per EAS
      environment:
      `sh
npx eas-cli env:create --environment development|preview|production
`
      These are what actually reach the build; nothing in `eas.json` itself
      carries a literal value for any of them.
- [ ] **Verify the first preview build on a real device**, not just the
      `development` profile's simulator build. TLS pinning, SQLCipher, App
      Attest, and freeRASP's integrity checks all either don't run at all
      or behave differently in a simulator — see the existing notes under
      "TLS pinning" and "Runtime integrity (freeRASP)" above.

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
