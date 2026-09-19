import type { Env } from "./env-schema";
import { FEATURE_FLAGS, createStaticFlagSource, flags, type FeatureFlag } from "./flags";

function envFor(overrides: Partial<Env> = {}): Env {
  return Object.freeze({
    variant: "production",
    apiUrl: "https://api.sundaybest.com",
    attestationEnabled: false,
    sentryDsn: undefined,
    useRnFetch: true,
    ...overrides,
  });
}

describe("flags", () => {
  /**
   * The singleton is the thing the app actually imports, so this asserts the
   * wiring — that it is resolved from the real environment — rather than
   * re-testing the rules, which `createStaticFlagSource` covers below. The test
   * environment runs the development defaults from test/setup.ts.
   */
  it("resolves the flags for the environment the app was built with", () => {
    expect(flags.snapshot()).toEqual({
      attestation: false,
      crashReporting: false,
      verboseLogging: true,
    });
  });

  it("answers isEnabled for every known flag", () => {
    const answers = FEATURE_FLAGS.map((flag: FeatureFlag) => typeof flags.isEnabled(flag));

    expect(answers).toEqual(["boolean", "boolean", "boolean"]);
  });
});

describe("createStaticFlagSource", () => {
  it("reports every known flag in its snapshot", () => {
    const snapshot = createStaticFlagSource(envFor()).snapshot();

    expect(Object.keys(snapshot).sort()).toEqual([...FEATURE_FLAGS].sort());
  });

  it("returns a frozen snapshot", () => {
    expect(Object.isFrozen(createStaticFlagSource(envFor()).snapshot())).toBe(true);
  });

  describe("attestation", () => {
    it.each([true, false])("follows EXPO_PUBLIC_ATTESTATION_ENABLED (%p)", (enabled) => {
      const flags = createStaticFlagSource(envFor({ attestationEnabled: enabled }));

      expect(flags.isEnabled("attestation")).toBe(enabled);
    });
  });

  describe("crashReporting", () => {
    it("is off when no DSN is configured", () => {
      const flags = createStaticFlagSource(envFor({ sentryDsn: undefined }));

      expect(flags.isEnabled("crashReporting")).toBe(false);
    });

    it("is on when a DSN is configured", () => {
      const flags = createStaticFlagSource(envFor({ sentryDsn: "https://sentry.invalid/0" }));

      expect(flags.isEnabled("crashReporting")).toBe(true);
    });
  });

  describe("verboseLogging", () => {
    it.each([
      ["development", true],
      ["preview", true],
      ["production", false],
    ] as const)("is %p -> %p", (variant, expected) => {
      const flags = createStaticFlagSource(envFor({ variant }));

      expect(flags.isEnabled("verboseLogging")).toBe(expected);
    });

    /**
     * Not a style preference. Verbose logging in a shipped build is how user and
     * device data ends up in device logs, which is exactly what the security
     * rules forbid — so production must never be able to turn it on.
     */
    it("is off in production regardless of the other settings", () => {
      const flags = createStaticFlagSource(
        envFor({
          variant: "production",
          attestationEnabled: true,
          sentryDsn: "https://sentry.invalid/0",
        }),
      );

      expect(flags.isEnabled("verboseLogging")).toBe(false);
    });
  });
});
