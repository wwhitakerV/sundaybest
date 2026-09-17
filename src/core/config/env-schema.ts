import { z } from "zod";

/**
 * The shape of the app's environment, and the only place it is defined.
 *
 * This module is deliberately pure — it imports `zod` and nothing else, touches
 * no `process.env`, and uses no path aliases. That lets `scripts/check-env.mjs`
 * import this exact file under plain Node and validate `.env` files against the
 * same rules the app enforces at startup, instead of a second copy that drifts.
 */

/**
 * Module-local, not exported: nothing outside needs to name a variant yet, and
 * knip treats an export with no consumer as dead code. `app.config.ts` keeps its
 * own copy — see the note at the top of that file for why it cannot import this.
 */
const APP_VARIANTS = ["development", "preview", "production"] as const;

type AppVariant = (typeof APP_VARIANTS)[number];

/** The parsed, validated environment. Frozen; see `parseEnv`. */
export interface Env {
  readonly variant: AppVariant;
  readonly apiUrl: string;
  readonly attestationEnabled: boolean;
  /** `undefined` when no DSN is configured, which disables crash reporting. */
  readonly sentryDsn: string | undefined;
}

/**
 * What a human should do about each variable.
 *
 * These strings are the *only* thing a failure reports. Zod's own messages are
 * discarded, because a message is worth nothing if it cannot be shown — and
 * anything derived from the input risks echoing a value that was pasted into the
 * wrong variable. A Map rather than an object literal keeps lookups off
 * `security/detect-object-injection`.
 */
const EXPECTATIONS = new Map<string, string>([
  ["EXPO_PUBLIC_APP_VARIANT", `must be one of: ${APP_VARIANTS.join(", ")}`],
  [
    "EXPO_PUBLIC_API_URL",
    "must be an absolute URL; https is required in every variant except development",
  ],
  ["EXPO_PUBLIC_ATTESTATION_ENABLED", 'must be a boolean string, e.g. "true" or "false"'],
  ["EXPO_PUBLIC_SENTRY_DSN", "must be a URL when set; leave it empty to disable crash reporting"],
]);

const UNKNOWN_FIELD = "environment";

/**
 * Thrown when the environment does not satisfy the schema. Carries the failing
 * field names so a caller can report them without re-deriving them from the
 * message, and never carries a value.
 */
export class EnvConfigError extends Error {
  readonly fields: readonly string[];

  constructor(fields: readonly string[]) {
    super(buildMessage(fields));
    this.name = "EnvConfigError";
    this.fields = fields;
    // Class extends Error survives Babel's downlevelling only with this.
    Object.setPrototypeOf(this, EnvConfigError.prototype);
  }
}

function buildMessage(fields: readonly string[]): string {
  const lines = fields.map(
    (field) => `  - ${field}: ${EXPECTATIONS.get(field) ?? "is not a recognised setting"}`,
  );

  return [
    "Invalid environment configuration:",
    ...lines,
    "",
    "Values are omitted on purpose. See .env.example for the documented shape.",
  ].join("\n");
}

const HTTPS_URL = /^https:\/\//i;

const envSchema = z
  .object({
    EXPO_PUBLIC_APP_VARIANT: z.enum(APP_VARIANTS),
    EXPO_PUBLIC_API_URL: z.url(),
    EXPO_PUBLIC_ATTESTATION_ENABLED: z.stringbool(),
    // An empty string is how a .env file expresses "unset", so it is accepted
    // and normalised to undefined below.
    EXPO_PUBLIC_SENTRY_DSN: z.union([z.url(), z.literal("")]).optional(),
  })
  .superRefine((raw, ctx) => {
    // Plaintext http is a local-development convenience only. Allowing it in a
    // preview or production build would put every request on the wire in clear.
    if (raw.EXPO_PUBLIC_APP_VARIANT === "development") return;
    if (HTTPS_URL.test(raw.EXPO_PUBLIC_API_URL)) return;

    ctx.addIssue({
      code: "custom",
      path: ["EXPO_PUBLIC_API_URL"],
      message: "https required outside development",
    });
  });

/**
 * Parses and freezes the environment, or throws `EnvConfigError`.
 *
 * Unknown keys are dropped, so callers can hand over a whole `.env` file or a
 * subset of `process.env` without pre-filtering it.
 */
export function parseEnv(raw: Readonly<Record<string, string | undefined>>): Env {
  const result = envSchema.safeParse(raw);

  if (!result.success) {
    const fields = result.error.issues.map((issue) => {
      const [field] = issue.path;
      return field === undefined ? UNKNOWN_FIELD : String(field);
    });

    throw new EnvConfigError([...new Set(fields)]);
  }

  const dsn = result.data.EXPO_PUBLIC_SENTRY_DSN;

  return Object.freeze({
    variant: result.data.EXPO_PUBLIC_APP_VARIANT,
    apiUrl: result.data.EXPO_PUBLIC_API_URL,
    attestationEnabled: result.data.EXPO_PUBLIC_ATTESTATION_ENABLED,
    sentryDsn: dsn === undefined || dsn === "" ? undefined : dsn,
  });
}
