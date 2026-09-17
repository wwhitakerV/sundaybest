import { parseEnv, type Env } from "./env-schema";

/**
 * The app's environment, parsed once at startup.
 *
 * Every variable is read by literal dot notation on `process.env`. That is not a
 * style choice: Expo's Babel plugin only rewrites statically-written
 * `process.env.EXPO_PUBLIC_*` member expressions, so `process.env[name]` or
 * destructuring would compile to a lookup on an object that does not exist in a
 * release bundle and silently yield `undefined`.
 *
 * Parsing at module scope means a misconfigured build fails at launch with a list
 * of the variables at fault, rather than surfacing as `undefined` somewhere deep
 * in a feature much later.
 */
export const env: Env = parseEnv({
  EXPO_PUBLIC_APP_VARIANT: process.env.EXPO_PUBLIC_APP_VARIANT,
  EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
  EXPO_PUBLIC_ATTESTATION_ENABLED: process.env.EXPO_PUBLIC_ATTESTATION_ENABLED,
  EXPO_PUBLIC_SENTRY_DSN: process.env.EXPO_PUBLIC_SENTRY_DSN,
});
