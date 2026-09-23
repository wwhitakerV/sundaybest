import { redactSensitive } from "@/utils/redaction/redactSensitive";
import { env as defaultEnv } from "../config/env";
import { crashReporter } from "./crash-reporter";
import type { CrashReporter } from "./crash-reporter";
import type { Env } from "../config/env-schema";
import type { LogContext } from "./log-context";

export interface Logger {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, context?: LogContext): void;
}

function redactContext(context: LogContext | undefined): LogContext | undefined {
  if (context === undefined) return undefined;

  return Object.fromEntries(
    Object.entries(context).map(([key, value]) => [
      key,
      typeof value === "string" ? redactSensitive(value) : redactSensitive(JSON.stringify(value)),
    ]),
  );
}

/**
 * Builds a leveled logger.
 *
 * Never calls a console method in production — the security rules forbid it,
 * and a shipped device's console is readable. `metro.config.js` also strips
 * every `console.*` call from a production bundle at the minifier level, so
 * this is a behavioral guarantee with a bundler-level backstop, not the only
 * layer.
 *
 * Every message and every context value is redacted before it reaches the
 * console or the crash reporter — this is what makes it safe to pass request
 * details, not just the fact that logging happened at all.
 */
export function createLogger(env: Env, reporter: CrashReporter): Logger {
  const verbose = env.variant !== "production";

  // A switch rather than `console[level]`: indexing an object with a value
  // that ultimately traces back to a call-site argument is what
  // security/detect-object-injection warns about, even though this union is
  // narrow. TypeScript makes the switch exhaustive, so a new level added to
  // the type without a case here is a compile error. Same shape as
  // `flags.ts`'s `isEnabled`.
  function callConsole(
    level: "debug" | "info" | "warn" | "error",
    message: string,
    context: LogContext | undefined,
  ): void {
    const args: [string] | [string, LogContext] =
      context === undefined ? [message] : [message, context];

    switch (level) {
      case "debug":
        console.debug(...args);
        return;
      case "info":
        console.info(...args);
        return;
      case "warn":
        console.warn(...args);
        return;
      case "error":
        console.error(...args);
        return;
    }
  }

  function log(
    level: "debug" | "info" | "warn" | "error",
    message: string,
    context?: LogContext,
  ): void {
    const redactedMessage = redactSensitive(message);
    const redactedContext = redactContext(context);

    if (verbose) {
      callConsole(level, redactedMessage, redactedContext);
    }

    if (level === "error") {
      reporter.captureMessage(redactedMessage, redactedContext);
    }
  }

  return {
    debug: (message, context) => log("debug", message, context),
    info: (message, context) => log("info", message, context),
    warn: (message, context) => log("warn", message, context),
    error: (message, context) => log("error", message, context),
  };
}

/** The logger for this build, wired to the real crash reporter. */
export const logger: Logger = createLogger(defaultEnv, crashReporter);
