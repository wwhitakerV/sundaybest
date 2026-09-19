import type { ConfigContext, ExpoConfig } from "expo/config";
import expoRouterPlugin from "expo-router/plugin";
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
 */
const privacyManifests: NonNullable<NonNullable<ExpoConfig["ios"]>["privacyManifests"]> = {
  NSPrivacyAccessedAPITypes: [
    {
      // react-native (React, ReactCommon/cxxreact, RCT-Folly, boost, glog): C617.1
      // expo-file-system: 0A2A.1, 3B52.1
      NSPrivacyAccessedAPIType: "NSPrivacyAccessedAPICategoryFileTimestamp",
      NSPrivacyAccessedAPITypeReasons: ["C617.1", "0A2A.1", "3B52.1"],
    },
    {
      // react-native, expo-constants
      NSPrivacyAccessedAPIType: "NSPrivacyAccessedAPICategoryUserDefaults",
      NSPrivacyAccessedAPITypeReasons: ["CA92.1"],
    },
    {
      // react-native (ReactCommon/react/timing), boost
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
  // these three are empty on purpose and must stay that way. See
  // docs/privacy/data-inventory.md; anything that changes them needs an ADR.
  NSPrivacyTracking: false,
  NSPrivacyTrackingDomains: [],
  NSPrivacyCollectedDataTypes: [],
};

export default ({ config }: ConfigContext): ExpoConfig => {
  const variant = resolveVariant();
  const identity = VARIANTS[variant];

  return {
    ...config,
    name: identity.name,
    slug: "sundaybest",
    scheme: "sundaybest",
    owner: "walterwhitakerv",
    version: "1.0.0",
    orientation: "portrait",
    userInterfaceStyle: "automatic",
    icon: identity.icon,

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
    ],

    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
  };
};
