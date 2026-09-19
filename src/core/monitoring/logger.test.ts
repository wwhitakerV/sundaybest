import { createLogger } from "./logger";
import type { CrashReporter } from "./crash-reporter";
import type { Env } from "../config/env-schema";

// logger.ts's default singleton export constructs the real crash reporter at
// import time, which transitively pulls in @sentry/react-native. None of
// these tests exercise that singleton — they all build their own logger with
// a mock CrashReporter — but the import happens regardless, and the real SDK
// starts a setInterval as a side effect of its own import, which keeps Jest's
// process alive after the run. Mock it the same way crash-reporter.test.ts
// does so this file never touches the real module.
jest.mock("@sentry/react-native", () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  addBreadcrumb: jest.fn(),
  setUser: jest.fn(),
}));

jest.mock("expo-constants", () => ({
  __esModule: true,
  default: { expoConfig: { version: "1.0.0" }, manifest2: null },
}));

function envWith(variant: Env["variant"]): Env {
  return {
    variant,
    apiUrl: "https://api.sundaybest.com",
    attestationEnabled: false,
    sentryDsn: undefined,
    useRnFetch: true,
  };
}

/**
 * Builds a mock `CrashReporter` and hands back its `captureMessage` mock as
 * its own reference. Asserting on `reporter.captureMessage` directly trips
 * `@typescript-eslint/unbound-method` — the interface's methods are not
 * `this: void` — so callers that need to assert keep this reference instead
 * of reading the property back off the object, the same pattern
 * `freerasp-integrity.test.ts` uses for its own mock callbacks.
 */
function mockReporter(): { reporter: CrashReporter; captureMessage: jest.Mock } {
  const captureMessage = jest.fn();
  const reporter: CrashReporter = {
    captureException: jest.fn(),
    captureMessage,
    addBreadcrumb: jest.fn(),
  };
  return { reporter, captureMessage };
}

describe("createLogger", () => {
  describe("in production", () => {
    it("never calls any console method", () => {
      const debugSpy = jest.spyOn(console, "debug").mockImplementation(() => undefined);
      const infoSpy = jest.spyOn(console, "info").mockImplementation(() => undefined);
      const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => undefined);
      const errorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);

      const logger = createLogger(envWith("production"), mockReporter().reporter);
      logger.debug("a debug message");
      logger.info("an info message");
      logger.warn("a warning");
      logger.error("an error");

      expect(debugSpy).not.toHaveBeenCalled();
      expect(infoSpy).not.toHaveBeenCalled();
      expect(warnSpy).not.toHaveBeenCalled();
      expect(errorSpy).not.toHaveBeenCalled();
    });
  });

  describe.each(["development", "preview"] as const)("in %s", (variant) => {
    it("calls the matching console method", () => {
      const infoSpy = jest.spyOn(console, "info").mockImplementation(() => undefined);

      const logger = createLogger(envWith(variant), mockReporter().reporter);
      logger.info("hello");

      expect(infoSpy).toHaveBeenCalledTimes(1);
    });

    it("redacts the message before it reaches the console", () => {
      const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => undefined);

      const logger = createLogger(envWith(variant), mockReporter().reporter);
      logger.warn("contact me at walt.whitakerv@gmail.com");

      const [message] = (warnSpy.mock.calls[0] ?? []) as [string?];
      expect(message).not.toContain("walt.whitakerv@gmail.com");
      expect(message).toContain("[redacted:email]");
    });

    it("redacts string values inside the context object", () => {
      const errorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);

      const logger = createLogger(envWith(variant), mockReporter().reporter);
      logger.error("request failed", { token: "Bearer abcdefghijklmnopqrstuvwxyz123456" });

      const [, context] = (errorSpy.mock.calls[0] ?? []) as [string?, unknown?];
      expect(JSON.stringify(context)).not.toContain("abcdefghijklmnopqrstuvwxyz123456");
      expect(JSON.stringify(context)).toContain("[redacted:token]");
    });
  });

  describe("error", () => {
    it("forwards to the crash reporter as a breadcrumb-worthy message", () => {
      const { reporter, captureMessage } = mockReporter();
      jest.spyOn(console, "error").mockImplementation(() => undefined);

      const logger = createLogger(envWith("development"), reporter);
      logger.error("something broke", { code: "E_BOOM" });

      expect(captureMessage).toHaveBeenCalledTimes(1);
      const [message, context] = captureMessage.mock.calls[0] as [string, unknown];
      expect(message).toBe("something broke");
      expect(context).toEqual({ code: "E_BOOM" });
    });

    it("does not forward debug, info, or warn to the crash reporter", () => {
      const { reporter, captureMessage } = mockReporter();
      jest.spyOn(console, "debug").mockImplementation(() => undefined);
      jest.spyOn(console, "info").mockImplementation(() => undefined);
      jest.spyOn(console, "warn").mockImplementation(() => undefined);

      const logger = createLogger(envWith("development"), reporter);
      logger.debug("d");
      logger.info("i");
      logger.warn("w");

      expect(captureMessage).not.toHaveBeenCalled();
    });
  });
});
