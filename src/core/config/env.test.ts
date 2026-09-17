import { type Env } from "./env-schema";

/**
 * `env.ts` reads `process.env` at module scope, so each case sets the variables
 * and then re-loads the module with a cleared registry. The four variables are
 * written by name rather than through a loop: the same literal dot notation the
 * module itself is required to use, and no dynamic property access.
 */
interface RawEnv {
  // `| undefined` rather than just optional: exactOptionalPropertyTypes is on,
  // and these tests pass `undefined` explicitly to mean "unset this variable".
  variant: string | undefined;
  apiUrl: string | undefined;
  attestation: string | undefined;
  dsn: string | undefined;
}

function setProcessEnv({ variant, apiUrl, attestation, dsn }: RawEnv): void {
  if (variant === undefined) delete process.env.EXPO_PUBLIC_APP_VARIANT;
  else process.env.EXPO_PUBLIC_APP_VARIANT = variant;

  if (apiUrl === undefined) delete process.env.EXPO_PUBLIC_API_URL;
  else process.env.EXPO_PUBLIC_API_URL = apiUrl;

  if (attestation === undefined) delete process.env.EXPO_PUBLIC_ATTESTATION_ENABLED;
  else process.env.EXPO_PUBLIC_ATTESTATION_ENABLED = attestation;

  if (dsn === undefined) delete process.env.EXPO_PUBLIC_SENTRY_DSN;
  else process.env.EXPO_PUBLIC_SENTRY_DSN = dsn;
}

const DEFAULTS: RawEnv = {
  variant: "development",
  apiUrl: "https://api.sundaybest.com",
  attestation: "false",
  dsn: "",
};

/**
 * `jest.requireActual` rather than `await import(...)`: babel-preset-expo leaves
 * dynamic imports alone so Metro can split them, which means Jest needs
 * `--experimental-vm-modules` to run one. A synchronous load keeps the tests
 * simple and lets `toThrow` see the module-scope failure directly.
 */
function loadEnv(): Env {
  jest.resetModules();
  return jest.requireActual<{ env: Env }>("./env").env;
}

describe("env", () => {
  afterEach(() => {
    setProcessEnv(DEFAULTS);
  });

  it("parses the environment the bundle was built with", () => {
    setProcessEnv({
      variant: "preview",
      apiUrl: "https://preview.api.sundaybest.com",
      attestation: "true",
      dsn: "https://sentry.invalid/0",
    });

    expect(loadEnv()).toEqual({
      variant: "preview",
      apiUrl: "https://preview.api.sundaybest.com",
      attestationEnabled: true,
      sentryDsn: "https://sentry.invalid/0",
    });
  });

  it("exports a frozen config", () => {
    setProcessEnv(DEFAULTS);

    expect(Object.isFrozen(loadEnv())).toBe(true);
  });

  /**
   * The failure mode this is guarding against: a build ships with a variable
   * missing, nothing complains at launch, and the app runs with `undefined`
   * somewhere it expected a URL. Failing on load makes that a startup crash with
   * the variable named, which is far cheaper to diagnose.
   */
  it("throws on load when the environment is invalid", () => {
    setProcessEnv({ ...DEFAULTS, apiUrl: undefined });

    // Matched by name, not by `toThrow(EnvConfigError)`: jest.resetModules()
    // hands the reloaded module its own copy of env-schema, so the thrown error
    // is an EnvConfigError from a different class identity than the one imported
    // here. The name and the message are what a developer actually reads.
    let name = "";
    let message = "";
    try {
      loadEnv();
    } catch (error) {
      name = (error as Error).name;
      message = (error as Error).message;
    }

    expect(name).toBe("EnvConfigError");
    expect(message).toContain("EXPO_PUBLIC_API_URL");
  });
});
