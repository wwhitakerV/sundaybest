# Setup checklist

Steps that need a human: credentials, account actions, or a paid plan. Agents
must never perform these — they stop and add the step here instead. Nothing
below is checked off yet: every item needs a real account action this
session cannot take, even where the code and config that depend on it are
already written and tested.

Grouped by who does it and when: **Accounts & credentials** (one-time account
setup), **Security** (before real traffic or real threats matter),
**EAS & builds** (before the pipeline can run for real), **Per developer**
(each person, once, on their own machine), **Before first submission**
(the final gate before App Store review).

## Accounts & credentials

- [ ] **Apple Developer Program — organization enrollment.** Requires a
      D-U-N-S number for the legal entity. Request the D-U-N-S number first
      (free, can take up to ~5 business days), then enroll. Organization
      enrollment is required for a company-name App Store listing;
      individual enrollment does not need a D-U-N-S.
- [ ] **Enable 2FA on the Apple ID** used for App Store Connect and EAS
      credential automation.
- [ ] **Enable 2FA on the Expo account** (`walt.whitakerv@gmail.com`).
- [ ] **Enable 2FA on GitHub** (`@wwhitakerv`), preferring a hardware key or
      TOTP over SMS.
- [ ] **Register the three bundle IDs** in the Apple Developer portal — all
      three are already defined in [app.config.ts](../app.config.ts):
  - [ ] `com.walterwhitaker.sundaybest` (production)
  - [ ] `com.walterwhitaker.sundaybest.preview`
  - [ ] `com.walterwhitaker.sundaybest.dev`
- [ ] **Enable the App Attest capability** on all three bundle IDs in the
      Apple Developer portal. The entitlement is already declared in
      [app.config.ts](../app.config.ts); the capability itself is a portal
      action. See [ADR 0005](./adr/0005-app-attest-and-encrypted-storage.md).
- [ ] **Create the Sentry project** and obtain its DSN. Not a secret — like
      the API URL, it's compiled into the bundle — but per-project, so it
      can't be invented here. See "EAS & builds" below for where it's
      configured, and
      [docs/privacy/data-inventory.md](./privacy/data-inventory.md) for what
      it sends.
- [ ] **Generate a Sentry auth token** (Sentry → Developer Settings → Auth
      Tokens). This one genuinely is a secret — see "Security" below for how
      it's stored.
- [ ] **Register with Talsec** for freeRASP threat reporting, and get a real
      watcher email address to replace `PLACEHOLDER_WATCHER_MAIL` in
      [src/core/security/integrity/freerasp-integrity.ts](../src/core/security/integrity/freerasp-integrity.ts).
      A placeholder means threat reports go nowhere.
- [ ] **Create an Apple API key** (App Store Connect → Users and Access →
      Integrations → Keys, "App Manager" role or narrower). Store it in EAS
      credentials, not inline anywhere — see "EAS & builds" below.
- [ ] **Decide on universal links**, or remove the placeholder.
      [app.config.ts](../app.config.ts) declares
      `associatedDomains: ["applinks:sundaybest.com"]`, which does nothing on
      its own:
  - [ ] register `sundaybest.com` and serve it over https
  - [ ] publish an `apple-app-site-association` file at
        `https://sundaybest.com/.well-known/apple-app-site-association`,
        listing the team ID and each bundle ID
  - [ ] enable the Associated Domains capability on each bundle ID
  - [ ] if universal links aren't actually wanted, delete the
        `associatedDomains` entry instead of shipping a dead entitlement

## Security

- [ ] **Generate the real TLS pin hashes** for `api.sundaybest.com`.
      [src/core/api/pinning/](../src/core/api/pinning/) and
      [app.config.ts](../app.config.ts) are ready; a **preview or production
      build refuses to start** while the placeholder hashes in
      [pins.ts](../src/core/api/pinning/pins.ts) are still in place — that's
      deliberate. A pin is the base64 SHA-256 of the certificate's Subject
      Public Key Info, not of the certificate itself. From a shell:

```sh
openssl s_client -connect api.sundaybest.com:443 -servername api.sundaybest.com </dev/null |
  openssl x509 -pubkey -noout |
  openssl pkey -pubin -outform der |
  openssl dgst -sha256 -binary |
  openssl enc -base64
```

- [ ] **Generate a backup key and pin it too.** Two pins per domain are
      required, and the backup must be a key that's generated, **held
      offline, and not yet in use** — a single pin means rotating the
      certificate bricks every installed copy until users update.
- [ ] **Write down a rotation plan**: where the backup key lives, who can
      reach it, the order of operations (ship both pins → wait for
      adoption → rotate the server to the backup → generate the next
      backup), and the minimum adoption threshold before rotating.
      Rotating without an already-shipped backup pin is an outage with no
      remote fix.
- [ ] **Manually test a bad certificate on a preview build**, starting from
      a **cold launch** (TLS sessions are cached, so a warm session keeps
      succeeding after the pins change). Put a proxy (Charles, mitmproxy)
      in front of the device and confirm requests fail with the real pins
      and succeed with pinning disabled — otherwise the test proved
      nothing.
- [ ] Re-check after any certificate/CA change, or any `expo-sqlite`/SDK
      upgrade that could move the app back onto `expo/fetch` —
      `EXPO_PUBLIC_USE_RN_FETCH=1` must stay set (see
      [ADR 0006](./adr/0006-network-security-and-device-integrity.md)).
- [ ] **Replace `PLACEHOLDER_APP_TEAM_ID`** in
      [freerasp-integrity.ts](../src/core/security/integrity/freerasp-integrity.ts)
      with the real Apple Developer team ID. freeRASP checks the app's
      signature against it; a wrong value makes every launch look tampered.
- [ ] **Mount `useIntegrityMonitor`.** It's written and tested
      (`src/core/security/integrity/`) but nothing renders it yet — it
      needs a session to clear and a monitoring sink to report to. Until
      then no integrity signal is ever received. See
      [MASVS RESILIENCE-1/2](./security/masvs-checklist.md).
- [ ] **Test on a jailbroken device**, or accept the detection is
      unverified. A simulator can't exercise this: development deliberately
      disables monitoring, since a simulator trips `simulator`, `debug`, and
      `devMode` by design.
- [ ] **Generate the EAS Update code-signing key and certificate.** From a
      shell:

```sh
npx expo-updates codesigning:generate \
  --key-output-directory keys \
  --certificate-output-directory certs \
  --certificate-validity-duration-years 10 \
  --certificate-common-name "SundayBest"
```

Then `npx expo-updates codesigning:configure` to wire
`certs/eas-update-certificate.pem` into [app.config.ts](../app.config.ts)
(already referenced there — the file just doesn't exist yet). **Store
`keys/private-key.pem` somewhere outside this repo** — a password manager or
a secrets vault, never committed. Without code signing, anything that could
intercept or compromise `updates.url` could push arbitrary JS to every
installed copy of the app.

- [ ] **Store the Sentry auth token as an EAS environment variable named
      `SENTRY_AUTH_TOKEN` with secret visibility.** It authorizes uploading
      source maps and must never be `EXPO_PUBLIC_*`, never in `.env`, never
      committed. With no `organization`/`project` passed in
      [app.config.ts](../app.config.ts)'s Sentry plugin entry, the plugin
      falls back to `SENTRY_ORG`/`SENTRY_PROJECT`/`SENTRY_AUTH_TOKEN`
      environment variables at build time — set all three as EAS
      environment variables (org and project aren't secrets; the token is).
- [ ] **Confirm the export-compliance answer before the first submission.**
      [app.config.ts](../app.config.ts) sets
      `ios.config.usesNonExemptEncryption: false`, accurate for an app using
      only platform TLS — but SQLCipher (encryption at rest) can change the
      answer. Re-read Apple's "Complying with Encryption Export Regulations"
      and confirm; an incorrect declaration is a legal compliance problem,
      not a config bug. Verify with `npx expo config --type prebuild` — Expo
      strips `ios.config` from `--type public`.
- [ ] **Build the attestation/session backend.** None of the client-side
      attestation work in `src/core/security/attestation/` and
      `src/core/security/session/` is worth anything until a server verifies
      it — an assertion nobody checks is theatre. The full contract is
      [docs/api/attestation.md](./api/attestation.md); the obligations it
      places on the server:
  - [ ] verify attestations per Apple's guide in full: the certificate chain
        to Apple's App Attest root, the nonce (SHA-256 of authenticator data + SHA-256 of the challenge), the App ID hash against the correct
        team ID and bundle ID, a signature counter of `0` on attestation,
        the `aaguid` (`appattestdevelop` sandbox / `appattest` + zero
        padding production), and store the receipt for later risk
        assessment
  - [ ] verify assertions on every request, storing each key's public key at
        registration
  - [ ] **never act on a `keyId` alone** — it's public, and acting on one
        without a verifying assertion lets anyone burn another install's
        rate limit (abuse case U5 in the threat model)
  - [ ] replay protection: challenges single-use, stored, deleted on first
        use, expiring after 120 seconds; the assertion counter must
        **strictly increase** per key with the write transactional against
        issuing the token (a non-atomic update is a replay window — the
        half that gets forgotten)
  - [ ] issue short-lived access tokens (900s default) and rotate the
        refresh token on every use; a refresh token presented twice means
        it leaked — revoke that key's session family and force
        re-attestation
  - [ ] rate-limit per attested key: 10/min on `/attest/challenge`, 5/hour
        on `/attest/verify`, 30/hour on `/session/refresh`, plus a separate
        global limit for challenge requests with no `keyId`
  - [ ] accept both App Attest environments — Apple ignores the
        `appattest-environment` entitlement once a build ships through
        TestFlight or the App Store, so a **preview build from TestFlight
        produces production attestations**; decide per environment, never
        infer it from the bundle ID
  - [ ] accept only the three known bundle IDs, and keep production data
        scoped to the production bundle ID
  - [ ] decide what revokes a key — manual only, or automated on a risk
        signal from the attestation receipt

## EAS & builds

[eas.json](../eas.json), [.eas/workflows/](../.eas/workflows/), the release
skill, and [docs/release/runbook.md](./release/runbook.md) are all in place.
None of it can run for real until the account-level steps below happen —
[app.config.ts](../app.config.ts)'s `updates.url` and `extra.eas.projectId`
are placeholders until the first one does. `eas-cli` is deliberately **not**
a project dependency (`expo-doctor` rejects installing it in `package.json`
at all — see [ADR 0009](./adr/0009-eas-build-submit-and-update-pipeline.md));
every command below uses `npx eas-cli`, which always runs the latest release.

- [ ] **Run `npx eas-cli init`.** Creates the EAS project and fills in the
      real `extra.eas.projectId` in [app.config.ts](../app.config.ts),
      replacing `PLACEHOLDER_EAS_PROJECT_ID`. Also update `updates.url` to
      `https://u.expo.dev/<the real project id>` if `eas init` doesn't do it
      automatically — confirm with `npx expo config --type prebuild`
      afterward.
- [ ] **Connect the GitHub repo in the Expo dashboard** (project settings →
      GitHub). Required for `.eas/workflows/`'s `pull_request_labeled` and
      `push` triggers to fire at all — without it, every workflow only runs
      via manual `npx eas-cli workflow:run`.
- [ ] **Store the Apple API key in EAS credentials**
      (`npx eas-cli credentials` → iOS → App Store Connect API Key). Never
      inline in `eas.json`'s `submit` section, which is deliberately empty
      for exactly this reason.
- [ ] **Create the EAS environment variables** referenced by `eas.json`'s
      per-profile `"environment"` field — `EXPO_PUBLIC_ATTESTATION_ENABLED`
      (`false` for `development`, `true` for `preview`/`production`),
      `EXPO_PUBLIC_API_URL`, and `EXPO_PUBLIC_SENTRY_DSN` (once that DSN
      exists), one value per EAS environment:

```sh
npx eas-cli env:create --environment development|preview|production
```

These are what actually reach the build; nothing in `eas.json` itself
carries a literal value for any of them.

- [ ] **Confirm source maps upload from EAS Build** on the first real
      preview build — check the Sentry project's Releases view for the
      build's release/dist. No extra step should be needed once the
      environment variables above are set.
- [ ] **Confirm source maps upload from EAS Update separately**, once the
      first real update publishes. This is
      `npx sentry-expo-upload-sourcemaps dist`, distinct from the Build-time
      upload — chain it after `eas update` or run it as its own CI step.
- [ ] **Revisit `metro.config.js`'s decision to skip `withSentryConfig`.**
      `@sentry/react-native/metro`'s `withSentryConfig` (Debug IDs, tighter
      source-map correlation) currently breaks `npx expo export -p ios` with
      `TypeError: Cannot read properties of undefined (reading 'match')`,
      thrown from inside Sentry's own Metro serializer. Source maps still
      work without it via the release/dist tag. Re-test against whatever
      `@sentry/react-native` version is installed — check its changelog for
      a fix first.
- [ ] **Verify the first preview build on a real device**, not just the
      `development` profile's simulator build. TLS pinning, SQLCipher, App
      Attest, and freeRASP's integrity checks either don't run at all or
      behave differently in a simulator — see "Security" above.
- [ ] **Rebuild the development client** (`npx expo run:ios`, or a new EAS
      `development` build) now that `expo-clipboard` is installed for New
      Plan's Paste button. It's a native module: until the dev client is
      rebuilt, tapping Paste throws "Cannot find native module
      'ExpoClipboard'".

## Per developer

Each person working on the repo does these once on their own machine.
Nothing here is shared state, so none of it belongs in the sections above.

- [ ] **Trust the folder** when Claude Code first asks.
      `permissions.allow`, `extraKnownMarketplaces`, and most `env` values
      in [.claude/settings.json](../.claude/settings.json) only take effect
      after the folder is trusted — `deny` and `ask` rules apply
      immediately either way.
- [ ] **Run `/plugin`** and confirm the Expo plugin is installed. The
      project declares it in `.claude/settings.json`, but a plugin from an
      external source isn't installed automatically; `/plugin` shows the
      `claude plugin install` command if it's missing.
- [ ] **Run `/mcp`** and sign in to Expo, so the Expo MCP server is
      available in the session.
- [ ] **Log in to the Expo CLI as the same account**: local MCP
      capabilities require it — `npx expo whoami || npx expo login`.
- [ ] **Use `npm run dev:mcp`** rather than `npm start` for MCP local
      capabilities (screenshots, tapping views, finding elements by
      testID). They need `EXPO_UNSTABLE_MCP_SERVER=1` on the dev server.
- [ ] **Confirm the hooks loaded** with `/hooks`, and the rules and memory
      with `/context`. `/doctor` diagnoses a config that isn't taking
      effect.
- [ ] **Create a `.env`**: `cp .env.example .env`. The app parses its
      `EXPO_PUBLIC_*` variables at startup and refuses to launch without
      them, and `.env` is gitignored. `npm run check:env` validates
      whatever's there.
- [ ] **Install the `gitleaks` binary** so the pre-commit hook can find it
      on `PATH` — Homebrew (`brew install gitleaks`) or a binary download
      from <https://github.com/gitleaks/gitleaks/releases>. **Not**
      `npm install gitleaks`: the npm package of that name is an unrelated
      tool by a different author.
- [ ] **Set up commit signing** — GPG or SSH signing key, registered with
      GitHub
      (<https://docs.github.com/en/authentication/managing-commit-signature-verification>),
      and `git config commit.gpgsign true` (or the SSH equivalent) locally.
      Needed before branch protection is turned on below — once
      `required_signatures` is on, an unsigned commit can't be pushed at
      all.

## Before first submission

The final gate. Some of these are one-time repo/account setup, not
per-developer or per-release — grouped here because they specifically block
shipping, not because they recur.

- [ ] **Replace the placeholder app icons.** `assets/icon.png`,
      `icon-development.png`, and `icon-preview.png` are generated
      block-letter placeholders (`npm run icons`). Real artwork is needed
      before any TestFlight or App Store submission, with no alpha channel.
      Splash artwork is still unset — `app.config.ts` configures only a
      background colour.
- [ ] **Run `scripts/setup-branch-protection.sh`.** Needs the `gh` CLI
      installed and authenticated (`gh auth login`) as an account with admin
      on the repo. Sets, on `main`: pull requests required, 1 approval
      minimum, Code Owner review required, the CI job required and
      up-to-date, signed commits required, linear history required, force
      pushes blocked. Re-run it if the CI job name in
      [.github/workflows/ci.yml](../.github/workflows/ci.yml) ever changes
      — the script matches by name, not by workflow file.
- [ ] **Install the Renovate GitHub App** on the repo
      (<https://github.com/apps/renovate>) so
      [renovate.json](../renovate.json) actually takes effect. The config
      file alone does nothing without the app installed.
- [ ] **Turn on GitHub secret scanning with push protection.** Repo
      Settings → Code security → Secret scanning. Push protection rejects a
      commit containing a detected secret _before_ it reaches the remote —
      a second, GitHub-native layer alongside the local gitleaks pre-commit
      hook and the gitleaks CI job, not a replacement for either.
- [ ] **Turn on Dependabot alerts.** Repo Settings → Code security →
      Dependabot alerts. Distinct from Renovate: this is GitHub's own
      vulnerability _detection_, Renovate is the _update_ automation — keep
      both on.
- [ ] **Add crash and diagnostic data to the App Store privacy
      questionnaire**: category **Diagnostics → Crash Data**, not linked to
      the user, not used for tracking. See
      [docs/privacy/data-inventory.md](./privacy/data-inventory.md) for
      exactly what's sent and when (nothing, until the Sentry DSN above is
      provisioned).
- [ ] **Confirm every item in "Security" above is actually done** — the
      attestation/session backend obligations especially. An app that
      attests but whose server doesn't verify is worse than no attestation
      at all: it looks secure without being secure.
