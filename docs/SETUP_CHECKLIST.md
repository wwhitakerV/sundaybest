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
- [ ] **Register the bundle IDs** in the Apple Developer portal: - [ ] `com.walterwhitaker.sundaybest` (production) - [ ] staging/preview variant, once prompt-defined (e.g.
      `com.walterwhitaker.sundaybest.staging`)
- [ ] **App icon and splash artwork.** The Expo-branded template assets were
      removed, so `app.json` currently sets no `icon`. Real artwork is needed before
      any TestFlight or App Store submission.

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
