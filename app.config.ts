import type { ConfigContext, ExpoConfig } from "expo/config";
import expoRouterPlugin from "expo-router/plugin";
import fontPlugin from "expo-font/plugin";
import secureStorePlugin from "expo-secure-store/plugin";
import splashScreenPlugin from "expo-splash-screen/plugin";
import sqlitePlugin from "expo-sqlite/plugin";

/**
 * Expo app config. Replaces app.json so the three build variants can share one
 * definition instead of drifting apart.
 *
 * The variant comes from `APP_VARIANT`, a build-time variable read here under
 * Node. It is deliberately *not* `EXPO_PUBLIC_`: this value decides the app's
 * identity, and `EXPO_PUBLIC_` variables are for values the JavaScript bundle
 * reads at runtime.
 *
 *   APP_VARIANT=production npx expo config --type public
 *
 * The variant list is repeated from `src/core/config/env-schema.ts` rather than
 * imported, which was tried and reverted. `npx expo config --type public`
 * transpiles a nested `.ts` import fine, but `expo config --full` — the code path
 * `expo-doctor` uses — evaluates this file as CommonJS with no TypeScript require
 * hook and dies with "Cannot find module './src/core/config/env-schema'". Two
 * short lists that a reviewer reads side by side beat a shared import that works
 * under one command and breaks under another.
 *
 * Facts in this file (bundle ID, owner, scheme) come from docs/PROJECT.md.
 * Decisions come from docs/adr/0004-configuration-and-environments.md.
 */

/** Must stay in step with `APP_VARIANTS` in src/core/config/env-schema.ts. */
type AppVariant = "development" | "preview" | "production";

const APP_VARIANTS: readonly AppVariant[] = ["development", "preview", "production"];

interface VariantIdentity {
  readonly name: string;
  readonly bundleIdentifier: string;
  readonly icon: string;
  /**
   * Which App Attest environment this build talks to.
   *
   * Apple ignores this entitlement once a build is distributed through
   * TestFlight, the App Store, or the Enterprise programme — such a build always
   * uses production. So `preview` says `development` here and will nonetheless
   * produce **production** attestations when installed from TestFlight. The
   * backend therefore decides per environment rather than assuming the variant
   * implies it; that requirement is written into docs/api/attestation.md.
   */
  readonly appAttestEnvironment: "development" | "production";
}

/**
 * One row per variant, so the three identities sit side by side and a change to
 * one is visibly a change to one.
 */
const VARIANTS: Readonly<Record<AppVariant, VariantIdentity>> = {
  development: {
    name: "SundayBest (Dev)",
    bundleIdentifier: "com.walterwhitaker.sundaybest.dev",
    icon: "./assets/icon-development.png",
    appAttestEnvironment: "development",
  },
  preview: {
    name: "SundayBest (Preview)",
    bundleIdentifier: "com.walterwhitaker.sundaybest.preview",
    icon: "./assets/icon-preview.png",
    appAttestEnvironment: "development",
  },
  production: {
    name: "SundayBest",
    bundleIdentifier: "com.walterwhitaker.sundaybest",
    icon: "./assets/icon.png",
    appAttestEnvironment: "production",
  },
};

function isAppVariant(value: unknown): value is AppVariant {
  return APP_VARIANTS.some((variant) => variant === value);
}

/**
 * Resolves `APP_VARIANT`, defaulting to `development`.
 *
 * A default is required, not optional: `expo-doctor`, `expo export`, and
 * `expo config` all evaluate this file without setting the variable, and
 * `npm run validate` has to pass. `development` is the safe default because the
 * failure it produces — a dev-identity build where production was wanted — is
 * loud and unshippable, whereas defaulting to production would let a forgotten
 * variable quietly claim the real bundle ID.
 *
 * An unrecognised value throws rather than falling back, so a typo in CI is a
 * failed build and not a mystery.
 */
function resolveVariant(): AppVariant {
  // `unknown`, not `string`: expo-modules-core types process.env with an
  // `[key: string]: any` index signature, and APP_VARIANT is untrusted input
  // from whoever ran the command. Narrow it rather than trusting it. It is not
  // declared in src/types/expo-public-env.d.ts on purpose — app code must not be
  // able to read it, because it does not exist at runtime on a device.
  const raw: unknown = process.env.APP_VARIANT;

  if (raw === undefined || raw === "") return "development";
  if (isAppVariant(raw)) return raw;

  throw new Error(
    `APP_VARIANT must be one of: ${APP_VARIANTS.join(", ")}. Received an unrecognised value.`,
  );
}

/**
 * Required-reason API declarations for the App Store privacy manifest.
 *
 * Every entry below was taken from a `PrivacyInfo.xcprivacy` file that ships in
 * this project's own `node_modules`, not from a general list — Apple does not
 * reliably parse the manifests bundled by static CocoaPods dependencies, so the
 * app has to repeat what its dependencies declare. Re-run the audit after adding
 * a native module:
 *
 *   find node_modules -name PrivacyInfo.xcprivacy
 *
 * Reason codes are Apple's; see
 * https://developer.apple.com/documentation/bundleresources/describing-use-of-required-reason-api
 *
 * Re-audited for prompt 13 (final audit): freerasp-react-native's bundled
 * TalsecRuntime.xcframework ships its own PrivacyInfo.xcprivacy, missed when
 * that dependency was first added. Its FileTimestamp (C617.1) and
 * SystemBootTime (35F9.1) reasons were already covered by react-native's own
 * entries below; only its UserDefaults reason (1C8F.1) was new.
 */
const privacyManifests: NonNullable<NonNullable<ExpoConfig["ios"]>["privacyManifests"]> = {
  NSPrivacyAccessedAPITypes: [
    {
      // react-native (React, ReactCommon/cxxreact, RCT-Folly, boost, glog): C617.1
      // expo-file-system: 0A2A.1, 3B52.1
      // freerasp-react-native (TalsecRuntime): C617.1 (already covered)
      NSPrivacyAccessedAPIType: "NSPrivacyAccessedAPICategoryFileTimestamp",
      NSPrivacyAccessedAPITypeReasons: ["C617.1", "0A2A.1", "3B52.1"],
    },
    {
      // react-native, expo-constants
      // freerasp-react-native (TalsecRuntime): 1C8F.1
      NSPrivacyAccessedAPIType: "NSPrivacyAccessedAPICategoryUserDefaults",
      NSPrivacyAccessedAPITypeReasons: ["CA92.1", "1C8F.1"],
    },
    {
      // react-native (ReactCommon/react/timing), boost
      // freerasp-react-native (TalsecRuntime): 35F9.1 (already covered)
      NSPrivacyAccessedAPIType: "NSPrivacyAccessedAPICategorySystemBootTime",
      NSPrivacyAccessedAPITypeReasons: ["35F9.1"],
    },
    {
      // expo-file-system
      NSPrivacyAccessedAPIType: "NSPrivacyAccessedAPICategoryDiskSpace",
      NSPrivacyAccessedAPITypeReasons: ["E174.1", "85F4.1"],
    },
  ],

  // The product ships no analytics, no IDFA, and no third-party telemetry, so
  // NSPrivacyTracking/NSPrivacyTrackingDomains stay empty/false — that is a
  // product constraint, not an oversight, and changing it needs an ADR.
  //
  // NSPrivacyCollectedDataTypes is not empty, though: freerasp-react-native's
  // bundled manifest declares DeviceID and OtherDiagnosticData/OtherDataTypes,
  // all marked not linked to identity and not used for tracking. freeRASP
  // itself is not mounted at any screen yet (see docs/SETUP_CHECKLIST.md,
  // "Runtime integrity (freeRASP)"), but Apple's manifest requirement is
  // about what's linked into the binary, not what's actively exercised at
  // runtime — an unmounted-but-linked SDK's declared capabilities still have
  // to appear here. See docs/privacy/data-inventory.md for the full picture.
  NSPrivacyTracking: false,
  NSPrivacyTrackingDomains: [],
  NSPrivacyCollectedDataTypes: [
    {
      NSPrivacyCollectedDataType: "NSPrivacyCollectedDataTypeDeviceID",
      NSPrivacyCollectedDataTypeLinked: false,
      NSPrivacyCollectedDataTypeTracking: false,
      NSPrivacyCollectedDataTypePurposes: [
        "NSPrivacyCollectedDataTypePurposeAppFunctionality",
        "NSPrivacyCollectedDataTypePurposeAnalytics",
      ],
    },
    {
      NSPrivacyCollectedDataType: "NSPrivacyCollectedDataTypeOtherDiagnosticData",
      NSPrivacyCollectedDataTypeLinked: false,
      NSPrivacyCollectedDataTypeTracking: false,
      NSPrivacyCollectedDataTypePurposes: ["NSPrivacyCollectedDataTypePurposeAppFunctionality"],
    },
    {
      NSPrivacyCollectedDataType: "NSPrivacyCollectedDataTypeOtherDataTypes",
      NSPrivacyCollectedDataTypeLinked: false,
      NSPrivacyCollectedDataTypeTracking: false,
      NSPrivacyCollectedDataTypePurposes: ["NSPrivacyCollectedDataTypePurposeAppFunctionality"],
    },
  ],
};

export default ({ config }: ConfigContext): ExpoConfig => {
  const variant = resolveVariant();
  const identity = VARIANTS[variant];

  return {
    ...config,
    name: identity.name,
    slug: "sundaybest",
    scheme: "sundaybest",
    owner: "sunday-best",
    version: "1.0.0",
    orientation: "portrait",
    // Locked to light, not "automatic": the app never follows the device's
    // dark-mode setting. `useTheme()` always resolves the light theme
    // (src/theme/use-theme.ts), and this keeps native chrome — splash
    // screen, status bar, keyboard — from going dark underneath it. A real
    // dark theme is future work with its own design.
    userInterfaceStyle: "light",
    icon: identity.icon,

    // Ties an OTA update to the native build it's compatible with by
    // hashing the project's actual native surface (SDK version, config,
    // native modules) rather than a hand-maintained version number — an
    // update built for one fingerprint is never offered to a build with a
    // different one. Needs no config plugin of its own; `expo-updates`
    // autolinks. `updates.url` needs the real EAS project ID, which only
    // exists after `eas init` runs (see docs/SETUP_CHECKLIST.md) — the
    // placeholder below is what `eas update:configure` would write, kept
    // here so the shape is correct ahead of time rather than invented
    // later under time pressure.
    runtimeVersion: {
      policy: "fingerprint",
    },
    updates: {
      url: "https://u.expo.dev/d9518090-e337-4eca-9d7e-07aadbe94a0d",
      // A code-signing certificate makes expo-updates refuse any update
      // manifest that isn't signed by the matching private key — without
      // it, anything reachable at `updates.url` (including a compromised
      // or misconfigured CDN in front of it) could push arbitrary JS to
      // every installed copy of the app. Generating the key/cert is a
      // one-time human action tracked in docs/SETUP_CHECKLIST.md; the
      // private key must never be committed to this repo.
      // codeSigningCertificate: "./certs/eas-update-certificate.pem",
      // codeSigningMetadata: {
      //   keyid: "main",
      //   alg: "rsa-v1_5-sha256",
      // },
    },

    // iOS only, iPhone only. Listing one platform keeps `expo export` and the
    // Jest preset from building targets this product does not have.
    platforms: ["ios"],

    ios: {
      bundleIdentifier: identity.bundleIdentifier,
      supportsTablet: false,

      // PLACEHOLDER. Universal links need the matching apple-app-site-association
      // file served from https://sundaybest.com/.well-known/ and the Associated
      // Domains capability on the bundle ID — both human steps, tracked in
      // docs/SETUP_CHECKLIST.md. The entry stays here so the entitlement is part
      // of the config from the start rather than bolted on at submission time.
      associatedDomains: ["applinks:sundaybest.com"],

      privacyManifests,

      // App Attest. `@expo/app-integrity` ships no config plugin, so the
      // capability's entitlement is declared here; without it the native
      // DCAppAttestService calls fail at runtime. Confirmed against Apple's
      // entitlement reference — a String, "development" or "production".
      entitlements: {
        "com.apple.developer.devicecheck.appattest-environment": identity.appAttestEnvironment,
      },

      // Export compliance. `false` is accurate for the app as it stands: it
      // implements no cryptography of its own and relies only on the platform's
      // TLS, which is exempt. This sets ITSAppUsesNonExemptEncryption in
      // Info.plist so App Store Connect stops asking on every upload.
      //
      // Prompt 7 introduces SQLCipher. Encrypting data at rest with a
      // third-party library can change this answer, so the checklist requires
      // re-confirming it before the first submission rather than trusting this
      // comment. Note that `ios.config` is stripped from the public manifest, so
      // `expo config --type public` will not show it — use `--type prebuild`.
      config: {
        usesNonExemptEncryption: false,
      },
    },

    plugins: [
      expoRouterPlugin(),
      splashScreenPlugin({
        backgroundColor: "#FFFFFF",
      }),

      // SQLCipher is a native build flag, so the encrypted database needs a real
      // build — it does not work in Expo Go. The key is provisioned on-device by
      // src/core/security/database-key and applied with PRAGMA key at open.
      sqlitePlugin({
        useSQLCipher: true,
      }),

      // `faceIDPermission: false` on purpose. The app never passes
      // `requireAuthentication` to expo-secure-store, so it has no use for Face
      // ID, and declaring NSFaceIDUsageDescription would claim a capability the
      // app does not use — which is both an App Review question to answer and a
      // permission string to justify.
      secureStorePlugin({
        faceIDPermission: false,
      }),

      // No organization/project/authToken here on purpose. Passing none makes
      // the plugin fall back to the SENTRY_ORG / SENTRY_PROJECT /
      // SENTRY_AUTH_TOKEN environment variables at build time instead
      // (@sentry/react-native/plugin/build/withSentry.js:getSentryProperties)
      // — the auth token is a secret and must never live in a committed file.
      // See docs/SETUP_CHECKLIST.md for provisioning it as an EAS environment
      // variable with secret visibility. A bare package string rather than an
      // imported function, matching what `npx expo install @sentry/react-native`
      // itself prints as the config to add: Expo's plugin resolver finds the
      // package's own app.plugin.js from the name alone.
      "@sentry/react-native",

      // Links each font file into the native iOS bundle so it is present at
      // launch, ahead of/alongside `useFonts()`'s JS-side registration in
      // AppProviders. Font family names for `fontFamily` styles are taken
      // from each file's own internal name, not this list — see
      // src/theme/fonts.ts for what those names resolve to.
      fontPlugin({
        ios: {
          fonts: [
            "./assets/fonts/BodoniModa_9pt-Regular.ttf",
            "./assets/fonts/BodoniModa_9pt-Medium.ttf",
            "./assets/fonts/IBMPlexMono-Regular.ttf",
            "./assets/fonts/IBMPlexMono-Medium.ttf",
            "./assets/fonts/IBMPlexMono-SemiBold.ttf",
          ],
        },
      }),
    ],

    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },

    // Written by `eas init` once the checklist item runs; placeholder here
    // for the same reason as `updates.url` above.
    extra: {
      eas: {
        projectId: "d9518090-e337-4eca-9d7e-07aadbe94a0d",
      },
    },
  };
};
