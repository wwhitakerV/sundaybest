import type * as CrashReporterModule from "@/core/monitoring/crash-reporter";
import type * as SentryModule from "@sentry/react-native";
import type { Env } from "@/core/config/env-schema";

jest.mock("@sentry/react-native", () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  addBreadcrumb: jest.fn(),
  setUser: jest.fn(),
}));

jest.mock("expo-constants", () => ({
  __esModule: true,
  default: {
    expoConfig: { version: "1.0.0" },
    manifest2: null,
  },
}));

function envWith(sentryDsn: string | undefined): Env {
  return {
    variant: "production",
    apiUrl: "https://api.sundaybest.com",
    attestationEnabled: false,
    sentryDsn,
    useRnFetch: true,
  };
}

/**
 * `createSentryReporter` guards `Sentry.init` behind a module-scope flag so a
 * real app never double-initializes the SDK. That guard would otherwise leak
 * between tests in this file, since `clearMocks` resets a mock's call list but
 * not this module's own state. `resetModules` gives each test an independent
 * copy of that flag — and, because it also re-runs the `jest.mock` factories
 * above, a fresh set of mock functions too, so both must be re-resolved
 * together rather than reusing mocks captured at the top of the file.
 */
function freshReporter(): {
  createSentryReporter: typeof CrashReporterModule.createSentryReporter;
  sentry: jest.Mocked<typeof SentryModule>;
} {
  jest.resetModules();
  /* eslint-disable @typescript-eslint/no-require-imports -- resetModules requires a fresh require, not a cached import. */
  const sentry = require("@sentry/react-native") as jest.Mocked<typeof SentryModule>;
  const { createSentryReporter } =
    require("@/core/monitoring/crash-reporter") as typeof CrashReporterModule;
  /* eslint-enable @typescript-eslint/no-require-imports */
  return { createSentryReporter, sentry };
}

describe("createSentryReporter", () => {
  describe("with no DSN configured", () => {
    it("never initializes the sdk", () => {
      const { createSentryReporter, sentry } = freshReporter();
      createSentryReporter(envWith(undefined));

      expect(sentry.init).not.toHaveBeenCalled();
    });

    it("is a no-op for every method", () => {
      const { createSentryReporter, sentry } = freshReporter();
      const reporter = createSentryReporter(envWith(undefined));

      reporter.captureException(new Error("boom"));
      reporter.captureMessage("hello");
      reporter.addBreadcrumb("clicked");

      expect(sentry.captureException).not.toHaveBeenCalled();
      expect(sentry.captureMessage).not.toHaveBeenCalled();
      expect(sentry.addBreadcrumb).not.toHaveBeenCalled();
    });
  });

  describe("with a DSN configured", () => {
    const DSN = "https://examplePublicKey@o0.ingest.sentry.io/0";

    it("initializes the sdk with pii sending off", () => {
      const { createSentryReporter, sentry } = freshReporter();
      createSentryReporter(envWith(DSN));

      expect(sentry.init).toHaveBeenCalledWith(
        expect.objectContaining({ dsn: DSN, sendDefaultPii: false }),
      );
    });

    it("ties the release to the app version and dist to 'local' when not running an EAS Update", () => {
      const { createSentryReporter, sentry } = freshReporter();
      createSentryReporter(envWith(DSN));

      expect(sentry.init).toHaveBeenCalledWith(
        expect.objectContaining({ release: "1.0.0", dist: "local" }),
      );
    });

    it("ties dist to the running EAS Update's id when there is one", () => {
      jest.resetModules();
      jest.doMock("expo-constants", () => ({
        __esModule: true,
        default: { expoConfig: { version: "1.0.0" }, manifest2: { id: "update-123" } },
      }));
      /* eslint-disable @typescript-eslint/no-require-imports -- see freshReporter above. */
      const sentry = require("@sentry/react-native") as jest.Mocked<typeof SentryModule>;
      const { createSentryReporter } =
        require("@/core/monitoring/crash-reporter") as typeof CrashReporterModule;
      /* eslint-enable @typescript-eslint/no-require-imports */

      createSentryReporter(envWith(DSN));

      expect(sentry.init).toHaveBeenCalledWith(expect.objectContaining({ dist: "update-123" }));
    });

    it("never calls setUser", () => {
      const { createSentryReporter, sentry } = freshReporter();
      const reporter = createSentryReporter(envWith(DSN));

      reporter.captureException(new Error("boom"));

      expect(sentry.setUser).not.toHaveBeenCalled();
    });

    it("initializes only once across repeated construction", () => {
      const { createSentryReporter, sentry } = freshReporter();
      createSentryReporter(envWith(DSN));
      createSentryReporter(envWith(DSN));

      expect(sentry.init).toHaveBeenCalledTimes(1);
    });

    it("redacts a credential-shaped context value before forwarding it", () => {
      const { createSentryReporter, sentry } = freshReporter();
      const reporter = createSentryReporter(envWith(DSN));

      reporter.captureMessage("request failed", {
        token: "Bearer abcdefghijklmnopqrstuvwxyz123456",
      });

      const [, options] = sentry.captureMessage.mock.calls[0] ?? [];
      expect(JSON.stringify(options)).not.toContain("abcdefghijklmnopqrstuvwxyz123456");
      expect(JSON.stringify(options)).toContain("[redacted:token]");
    });

    it("redacts a credential-shaped message before forwarding it", () => {
      const { createSentryReporter, sentry } = freshReporter();
      const reporter = createSentryReporter(envWith(DSN));

      reporter.captureMessage("token leaked: Bearer abcdefghijklmnopqrstuvwxyz123456");

      const [message] = sentry.captureMessage.mock.calls[0] ?? [];
      expect(message).not.toContain("abcdefghijklmnopqrstuvwxyz123456");
    });

    it("survives captureException throwing", () => {
      const { createSentryReporter, sentry } = freshReporter();
      sentry.captureException.mockImplementationOnce(() => {
        throw new Error("sdk exploded");
      });
      const reporter = createSentryReporter(envWith(DSN));

      expect(() => reporter.captureException(new Error("boom"))).not.toThrow();
    });

    it("forwards addBreadcrumb, redacted", () => {
      const { createSentryReporter, sentry } = freshReporter();
      const reporter = createSentryReporter(envWith(DSN));

      reporter.addBreadcrumb("navigated to walt.whitakerv@gmail.com", { screen: "home" });

      expect(sentry.addBreadcrumb).toHaveBeenCalledWith({
        message: "navigated to [redacted:email]",
        data: { screen: "home" },
      });
    });

    it("survives addBreadcrumb throwing", () => {
      const { createSentryReporter, sentry } = freshReporter();
      sentry.addBreadcrumb.mockImplementationOnce(() => {
        throw new Error("sdk exploded");
      });
      const reporter = createSentryReporter(envWith(DSN));

      expect(() => reporter.addBreadcrumb("clicked")).not.toThrow();
    });

    it("survives captureMessage throwing", () => {
      const { createSentryReporter, sentry } = freshReporter();
      sentry.captureMessage.mockImplementationOnce(() => {
        throw new Error("sdk exploded");
      });
      const reporter = createSentryReporter(envWith(DSN));

      expect(() => reporter.captureMessage("hello")).not.toThrow();
    });

    it("passes non-string, non-nullish context values through JSON-stringified redaction", () => {
      const { createSentryReporter, sentry } = freshReporter();
      const reporter = createSentryReporter(envWith(DSN));

      reporter.captureMessage("event", { count: 3, nothing: null, missing: undefined });

      const [, options] = sentry.captureMessage.mock.calls[0] ?? [];
      expect(options).toEqual({ extra: { count: "3", nothing: null, missing: undefined } });
    });

    it("the beforeSend hook scrubs event message and exception values", () => {
      const { createSentryReporter, sentry } = freshReporter();
      createSentryReporter(envWith(DSN));

      const options = sentry.init.mock.calls[0]?.[0];
      const beforeSend = options?.beforeSend;
      expect(beforeSend).toBeDefined();

      const scrubbed = beforeSend?.(
        {
          type: undefined,
          message: "failed for walt.whitakerv@gmail.com",
          exception: {
            values: [{ type: "Error", value: "token Bearer abcdefghijklmnopqrstuvwxyz123456" }],
          },
          user: { id: "abc" },
        },
        {},
      );

      expect(JSON.stringify(scrubbed)).not.toContain("walt.whitakerv@gmail.com");
      expect(JSON.stringify(scrubbed)).not.toContain("abcdefghijklmnopqrstuvwxyz123456");
    });

    it("the beforeSend hook scrubs breadcrumbs and extra attached to the event", () => {
      const { createSentryReporter, sentry } = freshReporter();
      createSentryReporter(envWith(DSN));

      const options = sentry.init.mock.calls[0]?.[0];
      const scrubbed = options?.beforeSend?.(
        {
          type: undefined,
          breadcrumbs: [{ message: "went to walt.whitakerv@gmail.com" }],
          extra: { note: "contact walt.whitakerv@gmail.com" },
        },
        {},
      );

      expect(JSON.stringify(scrubbed)).not.toContain("walt.whitakerv@gmail.com");
    });

    it("the beforeSend hook strips the user field entirely", async () => {
      const { createSentryReporter, sentry } = freshReporter();
      createSentryReporter(envWith(DSN));

      const options = sentry.init.mock.calls[0]?.[0];
      const scrubbed = await options?.beforeSend?.(
        { type: undefined, user: { id: "abc", ip_address: "1.2.3.4" } },
        {},
      );

      expect(scrubbed?.user).toBeUndefined();
    });

    it("the beforeBreadcrumb hook scrubs breadcrumb message", () => {
      const { createSentryReporter, sentry } = freshReporter();
      createSentryReporter(envWith(DSN));

      const options = sentry.init.mock.calls[0]?.[0];
      const beforeBreadcrumb = options?.beforeBreadcrumb;
      expect(beforeBreadcrumb).toBeDefined();

      const scrubbed = beforeBreadcrumb?.(
        { message: "sent to walt.whitakerv@gmail.com" },
        undefined,
      );

      expect(JSON.stringify(scrubbed)).not.toContain("walt.whitakerv@gmail.com");
    });
  });
});
