import { EnvConfigError, parseEnv } from "./env-schema";

/**
 * A valid development environment. Each test starts from this and breaks exactly
 * one thing, so a failure names the rule that broke.
 */
const VALID_DEV = {
  EXPO_PUBLIC_APP_VARIANT: "development",
  EXPO_PUBLIC_API_URL: "https://api.sundaybest.com",
  EXPO_PUBLIC_ATTESTATION_ENABLED: "false",
  EXPO_PUBLIC_SENTRY_DSN: "",
} as const;

describe("parseEnv", () => {
  it("parses a complete development environment", () => {
    expect(parseEnv(VALID_DEV)).toEqual({
      variant: "development",
      apiUrl: "https://api.sundaybest.com",
      attestationEnabled: false,
      sentryDsn: undefined,
    });
  });

  it("parses a complete production environment", () => {
    expect(
      parseEnv({
        EXPO_PUBLIC_APP_VARIANT: "production",
        EXPO_PUBLIC_API_URL: "https://api.sundaybest.com",
        EXPO_PUBLIC_ATTESTATION_ENABLED: "true",
        EXPO_PUBLIC_SENTRY_DSN: "https://sentry.invalid/0",
      }),
    ).toEqual({
      variant: "production",
      apiUrl: "https://api.sundaybest.com",
      attestationEnabled: true,
      sentryDsn: "https://sentry.invalid/0",
    });
  });

  it("returns a frozen config, so nothing can reconfigure the app at runtime", () => {
    const config = parseEnv(VALID_DEV);

    expect(Object.isFrozen(config)).toBe(true);
  });

  it("ignores variables that are not part of the schema", () => {
    const config = parseEnv({ ...VALID_DEV, APP_VARIANT: "production", PATH: "/usr/bin" });

    expect(config.variant).toBe("development");
    expect(config).not.toHaveProperty("APP_VARIANT");
  });

  describe("EXPO_PUBLIC_ATTESTATION_ENABLED", () => {
    it.each([
      ["true", true],
      ["1", true],
      ["yes", true],
      ["false", false],
      ["0", false],
      ["no", false],
    ])("reads %p as %p", (raw, expected) => {
      expect(
        parseEnv({ ...VALID_DEV, EXPO_PUBLIC_ATTESTATION_ENABLED: raw }).attestationEnabled,
      ).toBe(expected);
    });

    it("rejects a value that is not a boolean string", () => {
      expect(() => parseEnv({ ...VALID_DEV, EXPO_PUBLIC_ATTESTATION_ENABLED: "maybe" })).toThrow(
        EnvConfigError,
      );
    });
  });

  describe("EXPO_PUBLIC_SENTRY_DSN", () => {
    it("is optional", () => {
      const { EXPO_PUBLIC_SENTRY_DSN: _omitted, ...withoutDsn } = VALID_DEV;

      expect(parseEnv(withoutDsn).sentryDsn).toBeUndefined();
    });

    it("treats an empty string as unset, because .env files cannot express absence", () => {
      expect(parseEnv({ ...VALID_DEV, EXPO_PUBLIC_SENTRY_DSN: "" }).sentryDsn).toBeUndefined();
    });

    it("rejects a DSN that is not a URL", () => {
      expect(() => parseEnv({ ...VALID_DEV, EXPO_PUBLIC_SENTRY_DSN: "not-a-dsn" })).toThrow(
        EnvConfigError,
      );
    });
  });

  describe("EXPO_PUBLIC_API_URL", () => {
    it("rejects a value that is not a URL", () => {
      expect(() => parseEnv({ ...VALID_DEV, EXPO_PUBLIC_API_URL: "api.sundaybest.com" })).toThrow(
        EnvConfigError,
      );
    });

    it("allows http in development, so a local API can be used", () => {
      expect(parseEnv({ ...VALID_DEV, EXPO_PUBLIC_API_URL: "http://localhost:3000" }).apiUrl).toBe(
        "http://localhost:3000",
      );
    });

    it.each(["preview", "production"])("requires https in %s", (variant) => {
      expect(() =>
        parseEnv({
          ...VALID_DEV,
          EXPO_PUBLIC_APP_VARIANT: variant,
          EXPO_PUBLIC_API_URL: "http://api.sundaybest.com",
        }),
      ).toThrow(/EXPO_PUBLIC_API_URL/);
    });
  });

  describe("failures", () => {
    it("rejects an unknown variant", () => {
      expect(() => parseEnv({ ...VALID_DEV, EXPO_PUBLIC_APP_VARIANT: "staging" })).toThrow(
        EnvConfigError,
      );
    });

    it("rejects a missing required variable", () => {
      const { EXPO_PUBLIC_API_URL: _omitted, ...withoutApiUrl } = VALID_DEV;

      expect(() => parseEnv(withoutApiUrl)).toThrow(/EXPO_PUBLIC_API_URL/);
    });

    it("names every failing variable, not just the first", () => {
      let message = "";
      try {
        parseEnv({
          EXPO_PUBLIC_APP_VARIANT: "staging",
          EXPO_PUBLIC_API_URL: "nope",
          EXPO_PUBLIC_ATTESTATION_ENABLED: "maybe",
        });
      } catch (error) {
        message = (error as Error).message;
      }

      expect(message).toContain("EXPO_PUBLIC_APP_VARIANT");
      expect(message).toContain("EXPO_PUBLIC_API_URL");
      expect(message).toContain("EXPO_PUBLIC_ATTESTATION_ENABLED");
    });

    it("exposes the failing field names", () => {
      let fields: readonly string[] = [];
      try {
        parseEnv({ ...VALID_DEV, EXPO_PUBLIC_API_URL: "nope" });
      } catch (error) {
        fields = (error as EnvConfigError).fields;
      }

      expect(fields).toEqual(["EXPO_PUBLIC_API_URL"]);
    });

    /**
     * A malformed call — not a malformed variable. Zod reports this at the root
     * with an empty path, so there is no field name to print. The message still
     * has to read as English rather than "undefined: undefined".
     */
    it("reports a failure that is not tied to one variable", () => {
      let message = "";
      try {
        // Deliberately the wrong shape, which the types would normally prevent.
        parseEnv(null as unknown as Record<string, string | undefined>);
      } catch (error) {
        message = (error as Error).message;
      }

      expect(message).toContain("environment");
      expect(message).toContain("is not a recognised setting");
    });

    /**
     * The whole point of failing loudly is that the message gets read — in a
     * terminal, in CI output, in a crash report. So it must never carry the value
     * that failed: an operator who pastes a real credential into the wrong variable
     * would otherwise leak it by running the app.
     */
    it("never includes the offending value in the message", () => {
      const planted = "FAKE-CREDENTIAL-SHAPED-STRING-FOR-THIS-TEST";

      let message = "";
      try {
        parseEnv({
          ...VALID_DEV,
          EXPO_PUBLIC_API_URL: planted,
          EXPO_PUBLIC_SENTRY_DSN: planted,
        });
      } catch (error) {
        message = (error as Error).message;
      }

      expect(message).not.toBe("");
      expect(message).not.toContain(planted);
      expect(message).not.toContain("FAKE-CREDENTIAL");
    });
  });
});
