import Constants from "expo-constants";
import * as Sentry from "@sentry/react-native";

import { redactSensitive } from "@/utils/redaction/redactSensitive";
import { env as defaultEnv } from "../config/env";
import type { Env } from "../config/env-schema";
import type { LogContext } from "./logger";

/**
 * Crash reporting, wrapped behind a narrow port. `@sentry/react-native` is the
 * implementation today; nothing outside this file names it, so it can be
 * swapped later without touching a call site.
 */
export interface CrashReporter {
  captureException(error: unknown, context?: LogContext): void;
  captureMessage(message: string, context?: LogContext): void;
  addBreadcrumb(message: string, context?: LogContext): void;
}

/** Falls back to this when the app was not launched from an EAS Update. */
const NO_UPDATE_DIST = "local";

/**
 * The running EAS Update's id, or `undefined` when there isn't one.
 *
 * `Constants.manifest2`'s type comes from `expo-manifests`, which is not an
 * installed package here (this app has no `expo-updates` dependency yet) —
 * TypeScript resolves it to `any`, so its `id` field is read back out through
 * an explicit runtime check rather than trusted as typed.
 */
function currentUpdateId(): string | undefined {
  const manifest2: unknown = Constants.manifest2;
  if (manifest2 === null || typeof manifest2 !== "object") return undefined;

  const id: unknown = (manifest2 as { id?: unknown }).id;
  return typeof id === "string" ? id : undefined;
}

function redactValue(value: unknown): unknown {
  if (typeof value === "string") return redactSensitive(value);
  if (value === null || value === undefined) return value;
  return redactSensitive(JSON.stringify(value));
}

function redactContext(context: LogContext | undefined): LogContext | undefined {
  if (context === undefined) return undefined;

  return Object.fromEntries(
    Object.entries(context).map(([key, value]) => [key, redactValue(value)]),
  );
}

/**
 * Scrubs every string an event or breadcrumb could carry, and strips `user`
 * and `request` outright.
 *
 * This is the actual privacy control, not the DSN gate: the DSN decides
 * whether anything is sent at all, this decides what a sent event contains.
 * `user`/`request` are removed rather than redacted field-by-field because
 * "no user IDs or stable device identifiers of any kind" is easier to keep
 * true by never populating those fields than by trusting a redaction rule to
 * catch every shape Sentry's own instrumentation might put there.
 */
function scrubEvent<T extends Sentry.Event>(event: T): T {
  // `exactOptionalPropertyTypes` treats "key present with value undefined"
  // as a different (disallowed) type from "key absent", so every optional
  // field below is rebuilt with the key omitted entirely when there is
  // nothing to put there, rather than assigned `undefined`.
  const scrubbed: T = { ...event, user: undefined, request: undefined };
  delete scrubbed.user;
  delete scrubbed.request;

  if (scrubbed.message !== undefined) {
    scrubbed.message = redactSensitive(scrubbed.message);
  }

  if (scrubbed.exception?.values) {
    scrubbed.exception = {
      values: scrubbed.exception.values.map((exception) => ({
        ...exception,
        ...(exception.value !== undefined && { value: redactSensitive(exception.value) }),
      })),
    };
  }

  if (scrubbed.breadcrumbs) {
    scrubbed.breadcrumbs = scrubbed.breadcrumbs.map(scrubBreadcrumb);
  }

  const redactedExtra = redactContext(scrubbed.extra);
  if (redactedExtra !== undefined) {
    scrubbed.extra = redactedExtra;
  }

  return scrubbed;
}

function scrubBreadcrumb(breadcrumb: Sentry.Breadcrumb): Sentry.Breadcrumb {
  const redactedData = redactContext(breadcrumb.data);

  return {
    ...breadcrumb,
    ...(breadcrumb.message !== undefined && { message: redactSensitive(breadcrumb.message) }),
    ...(redactedData !== undefined && { data: redactedData }),
  };
}

/**
 * Whether the SDK has already been initialized.
 *
 * Module-scope, mirroring `env.ts`'s own module-scope parse: `createLogger`
 * (and therefore this) can legitimately be called more than once — every test
 * file that imports the singleton constructs its own instance — and
 * `Sentry.init` is not itself idempotent-safe to call twice.
 */
let initialized = false;

/**
 * Builds the crash reporter for this build.
 *
 * A no-op whenever `env.sentryDsn` is unset — which is the `.env.example`
 * default, so crash reporting is inert in development and in any build that
 * has not been given a DSN, not just gated by a variant check. Mirrors
 * `flags.ts`'s own `crashReporting: config.sentryDsn !== undefined` so the
 * two can never disagree about whether reporting is on.
 */
export function createSentryReporter(env: Env): CrashReporter {
  if (env.sentryDsn === undefined) {
    return {
      captureException: () => undefined,
      captureMessage: () => undefined,
      addBreadcrumb: () => undefined,
    };
  }

  if (!initialized) {
    Sentry.init({
      dsn: env.sentryDsn,
      // Explicit rather than relying on the SDK default: this build sends no
      // IP address, no device name, and nothing else PII-shaped alongside an
      // event.
      sendDefaultPii: false,
      release: Constants.expoConfig?.version,
      // `manifest2` is only non-null when the running bundle came from an EAS
      // Update; this app has no expo-updates dependency yet, so it is always
      // null today and this always falls back to NO_UPDATE_DIST. Reads the
      // field anyway rather than hardcoding the fallback, so adopting EAS
      // Update later makes this correct with no change here.
      dist: currentUpdateId() ?? NO_UPDATE_DIST,
      beforeSend: (event) => scrubEvent(event),
      beforeBreadcrumb: (breadcrumb) => scrubBreadcrumb(breadcrumb),
    });
    initialized = true;
  }

  return {
    captureException(error, context) {
      try {
        const extra = redactContext(context);
        Sentry.captureException(error, extra === undefined ? undefined : { extra });
      } catch {
        // A crash reporter that can crash the app it is reporting from has
        // stopped being a safety net. Swallow and move on.
      }
    },
    captureMessage(message, context) {
      try {
        const extra = redactContext(context);
        Sentry.captureMessage(
          redactSensitive(message),
          extra === undefined ? undefined : { extra },
        );
      } catch {
        // See captureException above.
      }
    },
    addBreadcrumb(message, context) {
      try {
        const data = redactContext(context);
        Sentry.addBreadcrumb({
          message: redactSensitive(message),
          ...(data !== undefined && { data }),
        });
      } catch {
        // See captureException above.
      }
    },
  };
}

/** The crash reporter for this build. Shared by `logger.ts` and `error-boundary.tsx`. */
export const crashReporter: CrashReporter = createSentryReporter(defaultEnv);
