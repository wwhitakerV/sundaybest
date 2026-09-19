/**
 * The app's public environment variables, typed.
 *
 * `expo-modules-core` declares `NodeJS.ProcessEnv` with an `[key: string]: any`
 * index signature, so without this every `process.env.X` read is an implicit
 * `any` — it typechecks whatever you do with it, and the type-aware lint rules
 * flag the assignment instead. Declaring the four variables narrows them to
 * `string | undefined`, which is what they actually are: a variable absent from
 * the build is absent at runtime.
 *
 * Only `EXPO_PUBLIC_*` variables belong here. Anything else is either build-time
 * (`APP_VARIANT`, read in `app.config.ts`, which runs under Node) or a secret,
 * which must never reach the bundle at all.
 *
 * `src/core/config/env-schema.ts` is the contract for the *values*; this file
 * only says which names exist.
 */
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      /** Which variant this bundle was built for. See `APP_VARIANTS`. */
      EXPO_PUBLIC_APP_VARIANT?: string;
      /** Base URL of the API. https everywhere except the development variant. */
      EXPO_PUBLIC_API_URL?: string;
      /** Boolean string; gates the app-attestation flow. */
      EXPO_PUBLIC_ATTESTATION_ENABLED?: string;
      /** Optional Sentry DSN. Absent or empty disables crash reporting. */
      EXPO_PUBLIC_SENTRY_DSN?: string;
      /**
       * Always `"1"`. Read by Expo's own runtime, not by app code: it keeps
       * `globalThis.fetch` as React Native's implementation instead of
       * `expo/fetch`, which the TLS pinning library cannot reach. Declared here
       * because the env schema validates it.
       */
      EXPO_PUBLIC_USE_RN_FETCH?: string;
    }
  }
}

export {};
