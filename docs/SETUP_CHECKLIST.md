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
- [ ] **Register the bundle IDs** in the Apple Developer portal:
      - [ ] `com.walterwhitaker.sundaybest` (production)
      - [ ] staging/preview variant, once prompt-defined (e.g.
            `com.walterwhitaker.sundaybest.staging`)
- [ ] **App icon and splash artwork.** The Expo-branded template assets were
      removed, so `app.json` currently sets no `icon`. Real artwork is needed before
      any TestFlight or App Store submission.
